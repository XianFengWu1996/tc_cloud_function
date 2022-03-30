import express from 'express'
import * as authController from '../controller/auth';
import * as messageController from '../controller/message'
import * as customerController from '../controller/customer'
import { checkFirebaseToken } from '../middleware/auth';
import Stripe from 'stripe';
import { firestore } from 'firebase-admin';

const auth = express.Router();

// authentication
auth.post('/login', checkFirebaseToken, authController.Signin);

// MESSAGE 
auth.post('/message/send', checkFirebaseToken, messageController.sendMessage);

auth.post('/message/verify', checkFirebaseToken, messageController.verifyCode);

// CUSTOMER
auth.get('/customer', checkFirebaseToken, customerController.getCustomerInfo);

auth.post('/customer/phone', checkFirebaseToken, customerController.setDefaultPhoneNum);

auth.delete('/customer/phone', checkFirebaseToken,  customerController.deletePhoneNum);

auth.patch('/customer/name', checkFirebaseToken, customerController.updateCustomerName);

// ADDRESS
auth.post('/address/delivery', checkFirebaseToken, customerController.calculateDelivery)


const stripe = new Stripe('sk_test_zXSjQbIUWTqONah6drD5oFvC00islas5P7', {
    apiVersion: '2020-08-27',
});

// PAYMENT - WILL BE MOVE TO ITS OWN SECTION LATER
auth.post("/create-payment-intent", checkFirebaseToken, async (req, res) => {
    try {
        let user = (await firestore().collection('/usersTest').doc(req.user.uid).get()).data();
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            customer: user?.billings.stripe_customer_id,
            setup_future_usage: "off_session",
            amount: 1000,
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
    
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: (error as Error).message ?? 'Failed to create a payment intent'})
    }
  });

export default auth
