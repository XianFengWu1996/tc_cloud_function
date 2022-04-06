import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as paymentController from '../controller/payment'

const payment = express.Router();

payment.post("/update-payment-intent", checkFirebaseToken,paymentController.updatePaymentIntent);

payment.get('/get_payment_method', checkFirebaseToken, paymentController.getSavedPaymentList)

payment.post("/confirm", checkFirebaseToken, paymentController.confirmPaymentIntent);

payment.post("/place_order", checkFirebaseToken, paymentController.placeOrder)

export default payment;