import { Request, Response } from "express";
import Stripe from "stripe";
import { validateCart, validateCustomer } from "../utils/validateData";
import { createStripeCustomer, handlePlaceOrder, retrieveIntentFromCookie } from '../utils/payment'
import { v4 } from "uuid";
import { firestore } from "firebase-admin";
import { isBoolean, isNumber, isString } from "lodash";


export const stripe = new Stripe('sk_test_zXSjQbIUWTqONah6drD5oFvC00islas5P7', {
    apiVersion: '2020-08-27',
});


export const updatePaymentIntent  = async(req: Request, res: Response) => {
    try {
        let s_id = req.cookies.s_id;
        let total = req.body.total 
        let future_use = req.body.future_use;

        console.log(future_use);

        if(!isString(s_id)){
            throw new Error('ERR: s_id is not avaiable')
        }
    
        if(!isNumber(total)){
            throw new Error('ERR: total is required ')
        }

        if(!isBoolean(future_use)){
            throw new Error('ERR: future_use is required')
        }
        
        let user = (await firestore().collection('usersTest').doc(req.user.uid).get()).data() as ICustomer
        let customer_id = user.billings.stripe_customer_id;
        if(!customer_id){
            customer_id = await createStripeCustomer({
                email: req.user.email ?? '',
                uid: req.user.uid,
                transaction: null,
                type: 'collection'
            });
        }

        // filter out the payment intent id from the client secret
        let payment_intent_id = retrieveIntentFromCookie(s_id);
        
        await stripe.paymentIntents.update(payment_intent_id, future_use ? {
            amount: Number((total * 100).toFixed(0)),
            customer: customer_id,
            setup_future_usage: 'on_session'
        } : {
            amount: Number((total * 100).toFixed(0)),
            customer: customer_id,
        })
    
        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to update intent'})
    }
}

export const confirmPaymentIntent =  async (req: Request, res: Response) => {
    try {
        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();
        let s_id = req.cookies.s_id;

        if(!s_id){
            throw new Error('ERR: s_id is not avaiable')
        }

        // validate all the data
        validateCustomer(customer);
        validateCart(cart);

        // update payment intent is to make sure the total charge is alway up to date
        // let payment_intent_id = await updatePaymentIntent(req.cookies.s_id, cart.total);
        let payment_intent_id = retrieveIntentFromCookie(s_id)

        // place the order to firestore
        await handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id });
        
        //remove the cookie (s_id) after the order completes
        res.clearCookie('s_id');
        res.send({ order_id })
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const getSavedPaymentList = async ( req: Request, res: Response) => {
    try {
        // get the customer id from the database
        let user_ref = firestore().collection('/usersTest').doc(req.user.uid);
        let user = (await user_ref.get()).data() as ICustomer

        // throw error if no user is found, rare case
        if(!user){
            throw new Error('No user exist')
        }

        // in case no stripe_customer_id is not found, create a customer with stripe
        let customer_id: string = user.billings.stripe_customer_id;
        if(!user.billings.stripe_customer_id){
            // will create and save the id to the firestore
            customer_id = await createStripeCustomer({
                email: req.user.email ?? '',
                uid: req.user.uid,
                transaction: null,
                type: 'collection'
            })
        }

        // retrieve the payment method list from stripe for the customer
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customer_id,
            type: 'card'
        })

        // loop through the list and generate a list of new public view payment method
        let publicPaymentMethods: IPublicPaymentMethod[] = [];
        paymentMethods.data.map((val) => {
            if(!val.card){
                throw new Error('Failed to list payment, some card information not found')
            }
            publicPaymentMethods.unshift({
                card: {
                    brand: val.card.brand,
                    exp_month: val.card.exp_month,
                    exp_year: val.card.exp_year,
                    last_four: val.card.last4
                },
                id: val.id
            })
        })

        // check for s_id in the cookie
        let s_id = req.cookies.s_id;
        // if no s_id is found, we will need to generate a new payment intent 
        if(!s_id){
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                customer: customer_id, // associate the all the payment with this customer
                amount: 1000, // this is the minimum for credit card payment, but will be update during submit
                currency: "usd",
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            // set the cookie for payment intent
            res.cookie('s_id', paymentIntent.client_secret);
        }
        
        res.send({ cards: publicPaymentMethods})

    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to get payment list'})
    }
}

export const placeOrder = async (req: Request, res: Response) => {
    try {

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();

        // validate all the data
        validateCustomer(customer);
        validateCart(cart);

        // place the order to firestore
        handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id: '' });

        res.send({ order_id })
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}