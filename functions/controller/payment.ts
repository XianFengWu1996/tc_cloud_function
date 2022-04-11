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
        
        // let user = (await firestore().collection('usersTest').doc(req.user.uid).get()).data() as ICustomer
        // let customer_id = user.billings.stripe_customer_id;

        // if(!customer_id){
        //     customer_id = await createStripeCustomer({
        //         email: req.user.email ?? '',
        //         uid: req.user.uid,
        //         transaction: null,
        //         type: 'collection'
        //     });
        // }

        // filter out the payment intent id from the client secret
        let payment_intent_id = retrieveIntentFromCookie(s_id);

        await stripe.paymentIntents.update(payment_intent_id, {
            amount: Number((total * 100).toFixed(0))
        })
    
        res.status(200).send({ payment_intent: payment_intent_id});
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to update intent'})
    }
}

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


export const placeOnlineOrder =  async (req: Request, res: Response) => {
    try {
        if(!isString(req.body.payment_intent)){
            throw new Error('ERR: payment intent is required')
        }

        if(!isBoolean(req.body.is_new)){
            throw new Error('ERR: is_new is required')
        }
     

        let payment_intent = req.body.payment_intent

        // check if the wallet was successful
        let intent = await stripe.paymentIntents.retrieve(payment_intent);
        console.log(intent);

        if(intent.status !== 'succeeded'){
            console.log(intent.next_action?.type);
            if(intent.next_action?.type === 'wechat_pay_display_qr_code'){
                throw new Error('Wechat payment unsuccessful / cancelled')
            }

            if(intent.last_payment_error){
                throw new Error(intent.last_payment_error.message)
            }

            throw new Error('Payment was unsuccessful or cancelled')
        }
      
        // validate all the data
        validateCustomer(req.body.customer);
        validateCart(req.body.cart);

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();

        // // place the order to firestore
        await handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id: payment_intent });
        
        // //remove the cookie (s_id) after the order completes for new payment
        console.log(req.body.is_new)
        if(req.body.is_new){
            res.clearCookie('s_id');
        }

        res.send({ order_id })
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}

export const placeCashOrder = async (req: Request, res: Response) => {
    try {

         // validate all the data
         validateCustomer(req.body.customer);
         validateCart(req.body.cart);

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();

        // place the order to firestore
        await handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id: '' });

        res.send({ order_id })
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
            status: stripe_result.status
        });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to process payment with id'})
    }
}