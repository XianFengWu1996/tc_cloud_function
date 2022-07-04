import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as paymentController from '../controller/payment'

const order = express.Router();

// order 
order.post("/place_online_order", checkFirebaseToken, paymentController.placeOnlineOrder);

order.post("/place_cash_order", checkFirebaseToken, paymentController.placeCashOrder)

export default order;