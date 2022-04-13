import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as paymentController from '../controller/payment'

const payment = express.Router();

// stripe payment
payment.post("/update_payment_intent", checkFirebaseToken,paymentController.updatePaymentIntent);

payment.get('/get_payment_method', checkFirebaseToken, paymentController.getSavedPaymentList)

payment.post('/payment_method_id', checkFirebaseToken, paymentController.usePaymentMethodId)

// order 
payment.post("/place_online_order", checkFirebaseToken, paymentController.placeOnlineOrder);

payment.post("/place_cash_order", checkFirebaseToken, paymentController.placeCashOrder)

export default payment;