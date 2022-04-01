import { Request, Response } from "express";
import { firestore } from "firebase-admin";
import Stripe from "stripe";
import { validateCart, validateCustomer } from "../utils/validateData";
import { handlePlaceOrder, updatePaymentIntent } from '../utils/payment'
import { v4 } from "uuid";


export const stripe = new Stripe('sk_test_zXSjQbIUWTqONah6drD5oFvC00islas5P7', {
    apiVersion: '2020-08-27',
});

export const createPaymentIntent = async (req: Request, res: Response) => {
    try {
        if(!req.body.total){
            throw new Error('Err: Missing required field (total)')
        }

        let user = (await firestore().collection('/usersTest').doc(req.user.uid).get()).data();
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            customer: user?.billings.stripe_customer_id,
            setup_future_usage: "on_session",
            amount: req.body.total * 100,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            payment_method_options: {
                card: {
                  capture_method: 'manual',
                },
              },
        });
        // set the cookie for payment intent
        res.cookie('s_id', paymentIntent.client_secret);

        res.send();
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: (error as Error).message ?? 'Failed to create a payment intent'})
    }
}

export const confirmPaymentIntent =  async (req: Request, res: Response) => {
    try {

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        let order_id = v4();

        // validate all the data
        validateCustomer(customer);
        validateCart(cart);

        // update payment intent is to make sure the total charge is alway up to date
        let payment_intent_id = await updatePaymentIntent(req.cookies.s_id, cart.total);

        // place the order to firestore
        handlePlaceOrder({ order_id, user_id: req.user.uid, cart, customer, payment_intent_id });
        
        //remove the cookie (s_id) after the order completes
        res.clearCookie('s_id');
        res.send({ order_id })
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
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