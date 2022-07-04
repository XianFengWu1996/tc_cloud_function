import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as paymentController from '../controller/payment'

const payment = express.Router();

// stripe payment
payment.post("/update_payment_intent", checkFirebaseToken,paymentController.updatePaymentIntent);

payment.post('/payment_method_id', checkFirebaseToken, paymentController.usePaymentMethodId)

payment.post("/pay_with_intent", checkFirebaseToken, paymentController.usePaymentIntent)

payment.get('/payment_method', checkFirebaseToken, paymentController.getSavedPaymentList)

payment.delete('/payment_method', checkFirebaseToken, paymentController.deletePaymentMethod)

export default payment;