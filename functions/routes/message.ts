import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as messageController  from '../controller/message'

const message = express.Router();

// MESSAGE 
message.post('/sms/send', checkFirebaseToken, messageController.sendVerificationSMS);

message.post('/sms/verify', checkFirebaseToken, messageController.verifyCode);

message.get('/email/confirmation', messageController.sendContactMessage);

export default message