import { Request, Response } from "express";
import Stripe from "stripe";
import { validateCart, validateCustomer } from "../utils/validateData";
import { createPaymentIntent, generatePublicPaymentList, getCustomerId, retrieveIntentFromCookie, validateIntentStatus } from '../utils/payment'
import { v4 } from "uuid";
import { firestore } from "firebase-admin";
import { isBoolean, isNumber, isString } from "lodash";
import { date } from '../utils/time'


export const stripe = new Stripe('sk_test_zXSjQbIUWTqONah6drD5oFvC00islas5P7', {
    apiVersion: '2020-08-27',
});


// get the list of the saved payment list and create an intent if there isnt one
export const getSavedPaymentList = async ( req: Request, res: Response) => {
    try {
        // get the customer id from the database
        let user_ref = firestore().collection('/usersTest').doc(req.user.uid);
        let user = (await user_ref.get()).data() as ICustomer

        // throw error if no user is found, rare case
        if(!user){
            throw new Error('No user exist')
        }

        // fetch the customer id
        let customer_id = await getCustomerId(req.user.uid, req.user.email);

        // fetch the available payment method and generate a list
        let cards = await generatePublicPaymentList(customer_id)

        await createPaymentIntent(req, res, customer_id);
        
        res.send({ cards })

    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to get payment list'})
    }
}

// update the intent before confirming the intent
export const updatePaymentIntent  = async(req: Request, res: Response) => {
    try {
        let s_id = req.cookies.s_id;
        let total = req.body.total 
        
        if(!isString(s_id)){
            throw new Error('ERR: s_id is not avaiable')
        }
    
        if(!isNumber(total)){
            throw new Error('ERR: total is required ')
        }

        if(!isBoolean(req.body.future_use)){
            throw new Error('ERR: future_user is required')
        }

        // filter out the payment intent id from the client secret
        let payment_intent_id = retrieveIntentFromCookie(s_id);

        let intent = await stripe.paymentIntents.retrieve(payment_intent_id);

        // dont update the intent if it is successful already
        if(intent.status === 'succeeded'){
            return res.status(200).send({ payment_intent: payment_intent_id});
        }

        await stripe.paymentIntents.update(payment_intent_id, {
            amount: Number((total * 100).toFixed(0)),
            setup_future_usage: req.body.future_use ? 'on_session' : ''
        })
    
        res.status(200).send({ payment_intent: payment_intent_id});
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to update intent'})
    }
}

export const placeOnlineOrder =  async (req: Request, res: Response) => {
    try {    
        if(!isBoolean(req.body.is_new)){
            throw new Error('ERR: is_new is required')
        }

        await validateIntentStatus(req.body.payment_intent);

        // validate all the data
        validateCustomer(req.body.customer);
        validateCart(req.body.cart);

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();

        // place the order to firestore
        // await handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id: req.body.payment_intent });
        
        //remove the cookie (s_id) after the order completes for new payment
        if(req.body.is_new){
            res.clearCookie('s_id');
        }

        res.send({ 
            order_id,  
            order_time: date.toFormat('DDD T'), 
            item_count: cart.cart_quantity,
            estimate: cart.is_delivery ? 45 : 15, // for now
            total: cart.total
        })
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const placeCashOrder = async (req: Request, res: Response) => {
    try {
        console.log('cash order')
        console.log(date)

         // validate all the data
         validateCustomer(req.body.customer);
         validateCart(req.body.cart);

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();

        // place the order to firestore
        // await handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id: '' });

        res.send({ 
            order_id,  
            order_time: date.toFormat('DDD T'), 
            item_count: cart.cart_quantity,
            estimate: cart.is_delivery ? 45 : 15, // for now
            total: cart.total
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const usePaymentMethodId = async (req: Request, res: Response) => {
    try {
        if(!isString(req.body.card.id)){
            throw new Error('ERR: Payment method is invalid')
        }

        if(!isNumber(req.body.total)){
            throw new Error('ERR: Total is required')
        }

        let total: number = req.body.total;
        let payment_method_id = req.body.card.id;

        let user_ref = firestore().collection('usersTest').doc(req.user.uid);

        let user = (await user_ref.get()).data() as ICustomer;

        if(!user) {
            throw new Error('ERR: No user found')
        }

        let stripe_result = await stripe.paymentIntents.create({
            amount: Number((total * 100).toFixed(0)),
            currency: 'usd',
            customer: user.billings.stripe_customer_id,
            payment_method: payment_method_id,
            confirm: true,
        })

        res.send({
            payment_intent: stripe_result.id,
        });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to process payment with id'})
    }
}


