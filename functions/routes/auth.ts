import express from 'express'
import * as authController from '../controller/auth';
import * as messageController from '../controller/message'
import * as customerController from '../controller/customer'
import { checkFirebaseToken } from '../middleware/auth';

const auth = express.Router();

// authentication
auth.post('/login', checkFirebaseToken, authController.Signin);

// MESSAGE 
auth.post('/message/send', checkFirebaseToken, messageController.sendVerificationSMS);

auth.post('/message/verify', checkFirebaseToken, messageController.verifyCode);

auth.get('/email/confirmation', messageController.sendContactMessage);

// CUSTOMER
auth.get('/customer', checkFirebaseToken, customerController.getCustomerInfo);

auth.patch('/customer/name', checkFirebaseToken, customerController.updateCustomerName);

// ORDER
auth.get('/customer/order_history', checkFirebaseToken, customerController.getOrderHistory)

auth.get('/customer/reward_history', checkFirebaseToken, customerController.getRewardHistory)


// ADDRESS
auth.post('/address/delivery', checkFirebaseToken, customerController.calculateDelivery)

auth.patch('/address/apt_business', checkFirebaseToken, customerController.updateAptAndBusiness)

auth.delete('/address/apt_business', checkFirebaseToken, customerController.removeAptAndBusiness)


export default auth
