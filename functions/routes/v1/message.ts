import express from 'express'
import { checkFirebaseToken } from '../../middleware/auth';
import * as messageController  from '../../controller/message'

const message = express.Router();

/* ============================
    SMS & EMAIL
==============================*/

// will handle sending the verification code to the user
message.post('/sms/send', checkFirebaseToken, messageController.sendVerificationSMS);

// will handle verifying the verification code from the user
message.post('/sms/verify', checkFirebaseToken, messageController.verifyCode);

// message.get('/email/confirmation', messageController.sendContactMessage);

export default message