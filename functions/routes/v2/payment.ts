import express from 'express';
// import * as storeController from '../../controller/v2/store';
// import {  checkTokenInCookie } from '../middleware/auth';
// import { filesUpload } from '../middleware/upload'
// import { body } from 'express-validator';
import * as paymentController from '../../controller/v2/payment'


const payment = express.Router();

// get all the menu data, also return the store data
payment.get('/initiate_intent', paymentController.initiatePaymentIntent);

export default payment;