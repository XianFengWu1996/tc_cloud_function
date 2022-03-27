import express from 'express'
import * as authController from '../controller/auth';
import * as messageController from '../controller/message'
import * as customerController from '../controller/customer'
import { checkFirebaseToken } from '../middleware/auth';

const auth = express.Router();

// authentication
auth.post('/login', checkFirebaseToken, authController.Signin);

// MESSAGE 
auth.post('/message/send', checkFirebaseToken, messageController.sendMessage);

auth.post('/message/verify', checkFirebaseToken, messageController.verifyCode);

// CUSTOMER
auth.post('/customer/phone', checkFirebaseToken, customerController.setDefaultPhoneNum);

auth.delete('/customer/phone', checkFirebaseToken,  customerController.deletePhoneNum);

auth.patch('/customer/name', checkFirebaseToken, customerController.updateCustomerName);

// ADDRESS
auth.post('/address/delivery', checkFirebaseToken, customerController.calculateDelivery)



export default auth
