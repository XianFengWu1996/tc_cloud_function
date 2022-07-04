import express from 'express'
import * as authController from '../controller/auth';
import { checkFirebaseToken } from '../middleware/auth';

const auth = express.Router();

// authentication
auth.post('/login', checkFirebaseToken, authController.Signin);

export default auth
