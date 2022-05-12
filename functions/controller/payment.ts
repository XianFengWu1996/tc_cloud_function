import { Request, Response } from "express";
import Stripe from "stripe";
import { validateCart } from "../utils/validateData";
import { createPaymentIntent, generatePublicPaymentList, getCustomerId, handleConfirmingOrder, handlePlaceCashOrder, handlePlaceOnlineOrder, retrieveIntentFromCookie } from '../utils/payment'
import { firestore } from "firebase-admin";
import { isBoolean, isEmpty, isNumber, isString } from "lodash";
import {  format_date } from "../utils/time";


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

// place an online order but not process the payment yet
export const placeOnlineOrder =  async (req: Request, res: Response) => {
    try {    
        // validate all the data
        validateCart(req.body.cart);
        // place the order to firestore
        await handlePlaceOnlineOrder({ 
            user_id: req.user.uid, 
            cart: req.body.cart as ICart, 
            payment_intent_id: ''
        });

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

// place the order since it does not require payment
export const placeCashOrder = async (req: Request, res: Response) => {
    try {
        const cart = req.body.cart as ICart;
        const { formatted } = format_date();

        // validate all the data
         validateCart(cart);
        // place the order to firestore
        let { customer } = await handlePlaceCashOrder({ 
            user_id: req.user.uid, 
            cart: req.body.cart as ICart,
            payment_intent_id: '',
        })

        res.status(200).send({
            redirect_url: `/order/confirmation?order_id=${cart.order_id}&order_time=${formatted}&name=${customer.name}&estimate=${15}&item_count=${cart.cart_quantity}&total=${cart.total}`
        });
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

// pay with existing payment method id
export const usePaymentMethodId = async (req: Request, res: Response) => {
    try {
        if(!isString(req.body.card.id)){
            throw new Error('ERR: Payment method is invalid')
        }
        validateCart(req.body.cart);

        const cart:ICart = req.body.cart;
        const payment_method_id = req.body.card.id;

        let customer = (await firestore().collection('usersTest').doc(req.user.uid).get()).data() as ICustomer

        if(!customer) {
            throw new Error('ERR: No user found')
        }

        let stripe_result = await stripe.paymentIntents.create({
            amount: Number((cart.total * 100).toFixed(0)),
            currency: 'usd',
            customer: customer.billings.stripe_customer_id,
            payment_method: payment_method_id,
            confirm: true,
        })

        if(stripe_result.status !== 'succeeded'){
            throw new Error('Payment was not successful')
        }

        await handleConfirmingOrder(cart, req.user.uid, stripe_result);

        const { formatted } = format_date()

        res.status(200).send({
            redirect_url: `/order/confirmation?order_id=${cart.order_id}&order_time=${formatted}&name=${customer.name}&estimate=${15}&item_count=${cart.cart_quantity}&total=${cart.total}`
        });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to process payment with id'})
    }
}

// confirm the order after the payment is successful
export const usePaymentIntent = async (req: Request, res: Response) => {
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

        const { formatted } = format_date();

        // clear the s_id cookie once everything is successful
        res.clearCookie('s_id');

        res.status(200).send({
            redirect_url: `/order/confirmation?order_id=${cart.order_id}&order_time=${formatted}&name=${customer.name}&estimate=${15}&item_count=${cart.cart_quantity}&total=${cart.total}`
        });
    
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}



