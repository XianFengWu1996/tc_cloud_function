import express from 'express'
import { checkFirebaseToken } from '../../middleware/auth';
import * as paymentController from '../../controller/payment'

const payment = express.Router();


/* ============================
    STRIPE PAYMENTS
==============================*/  

// retrieve all the available payment method for the customer
payment.get('/payment_method_list', checkFirebaseToken, paymentController.getSavedPaymentMethodList)

// update the intent when the customer is ready to pay
payment.patch("/update_payment_intent", checkFirebaseToken,paymentController.updatePaymentIntent);

// remove the specific payment id with the payment method id provided
payment.delete('/payment_method_by_id', checkFirebaseToken, paymentController.deletePaymentMethodById)

// pay with the saved payment method
payment.post('/pay_with_payment_method', checkFirebaseToken, paymentController.payWithSavedPaymentMethod)

// paym with the payment intent (new card)
payment.post("/pay_with_intent", checkFirebaseToken, paymentController.payWithPaymentIntent)



export default payment;