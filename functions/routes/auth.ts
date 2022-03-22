import express from 'express'
import * as authController from '../controller/auth';
import * as messageController from '../controller/message'
import { checkFirebaseToken } from '../middleware/auth';

const auth = express.Router();

// authentication
auth.post('/login', checkFirebaseToken, authController.Signin);

// MESSAGE 
auth.post('/message/send', checkFirebaseToken, messageController.sendMessage);

auth.post('/message/verify', checkFirebaseToken, messageController.verifyCode);

// CUSTOMER
auth.post('/customer/phone', checkFirebaseToken, messageController.setDefaultPhoneNum);

auth.delete('/customer/phone', checkFirebaseToken,  messageController.deletePhoneNum);

auth.patch('/customer/name', checkFirebaseToken, messageController.updateCustomerName);




export default auth
