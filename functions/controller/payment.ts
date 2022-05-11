import { Request, Response } from "express";
import Stripe from "stripe";
import { validateCart, validateCustomer } from "../utils/validateData";
import { createPaymentIntent, generatePublicPaymentList, getCustomerId, handleConfirmingOrder, handlePlaceCashOrder, handlePlaceOnlineOrder, retrieveIntentFromCookie } from '../utils/payment'
import { firestore } from "firebase-admin";
import { isBoolean, isEmpty, isNumber, isString } from "lodash";
import { date, format_date, timestamp } from "../utils/time";
import { format } from "path/posix";


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
        let total = req.body.total;
        
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
            setup_future_usage: req.body.future_use ? 'off_session' : '',
        })
    
        res.status(200).send({ payment_intent: payment_intent_id});


    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to update intent'})
    }
}

export const placeOnlineOrder =  async (req: Request, res: Response) => {
    try {    
        // validate all the data
        validateCustomer(req.body.customer);
        validateCart(req.body.cart);
        // place the order to firestore
        await handlePlaceOnlineOrder({ 
            user_id: req.user.uid, 
            cart: req.body.cart as ICart, 
            customer: req.body.customer as ICustomer, 
            payment_intent_id: ''
        });

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const placeCashOrder = async (req: Request, res: Response) => {
    try {
         // validate all the data
         validateCustomer(req.body.customer);
         validateCart(req.body.cart);

        // place the order to firestore
        await handlePlaceCashOrder({ 
            user_id: req.user.uid, 
            cart: req.body.cart as ICart,
            customer: req.body.customer as ICustomer,
            payment_intent_id: '',
        })

        res.status(200).send();
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const confirmOnlineOrder = async (req: Request, res: Response) => {
    try {
        let s_id = req.cookies.s_id;
        let cart = req.body.cart as ICart;

        // check if the cookie contain s_id, 
        if(isEmpty(s_id)){
            throw new Error('Unable to find the s_id, please refresh the payment page')
        }

        // validate the cart 
        validateCart(cart);

        const payment_intent = retrieveIntentFromCookie(s_id)
        const stripe_result = await stripe.paymentIntents.retrieve(payment_intent);
        if(stripe_result.status !== 'succeeded'){
            throw new Error('Payment was not successful')
        }

        // handle confirming the order in firestore
        let { customer } = await handleConfirmingOrder(cart, req.user.uid, stripe_result)

        // clear the s_id cookie once everything is successful
        res.clearCookie('s_id');

        res.status(200).send({
            redirect_url: `/order/confirmation?order_id=${cart.order_id}&order_time=${format_date}&name=${customer.name}&estimate=${15}&item_count=${cart.cart_quantity}&total=${cart.total}`
        });
    
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const usePaymentMethodId = async (req: Request, res: Response) => {
    try {
        if(!isString(req.body.card.id)){
            throw new Error('ERR: Payment method is invalid')
        }

        validateCart(req.body.cart);
        validateCustomer(req.body.customer);

        let cart:ICart = req.body.cart;
        let customer:ICustomer = req.body.customer;
        let payment_method_id = req.body.card.id;

        let user = (await firestore().collection('usersTest').doc(req.user.uid).get()).data() as ICustomer

        if(!user) {
            throw new Error('ERR: No user found')
        }

        let stripe_result = await stripe.paymentIntents.create({
            amount: Number((cart.total * 100).toFixed(0)),
            currency: 'usd',
            customer: user.billings.stripe_customer_id,
            payment_method: payment_method_id,
            confirm: true,
        })

        if(stripe_result.status !== 'succeeded'){
            throw new Error('Payment was not successful')
        }

        // handle the rewards

        let order:IFirestoreOrder |  {} = {
            payment: {
                payment_intent_id: stripe_result.id,
            },
            date: {
                month: date.month,
                day: date.day,
                year: date.year,
            },
            summary: {
                subtotal: cart.subtotal,
                original_subtotal: cart.original_subtotal,
                tax: cart.tax,
                tip: cart.tip,
                tip_type: cart.tip_type,
                total: cart.total,
            },
            created_at: timestamp,
            status: 'completed'
        }

        // at this point, the order is already in the database and the payment is successful
        await firestore().collection('orderTest').doc(cart.order_id).set(order, { merge: true })

        res.status(200).send({
            order_id: cart.order_id,
            order_time: format_date,
            estimate: 15, 
            item_count: cart.cart_quantity,
            total: cart.total
        });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to process payment with id'})
    }
}


