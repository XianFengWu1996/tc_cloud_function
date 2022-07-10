import express from 'express'
import * as authController from '../../controller/auth';
import { checkFirebaseToken } from '../../middleware/auth';

const auth = express.Router();


/* ============================
   AUTHENTICATION
==============================*/

// handle the login process
auth.post('/login', checkFirebaseToken, authController.Signin);

export default auth
