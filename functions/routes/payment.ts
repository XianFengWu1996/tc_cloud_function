import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as paymentController from '../controller/payment'

const payment = express.Router();

// PAYMENT - WILL BE MOVE TO ITS OWN SECTION LATER
payment.post("/create-payment-intent", checkFirebaseToken, paymentController.createPaymentIntent);

payment.post("/confirm", checkFirebaseToken, paymentController.confirmPaymentIntent);

export default payment;