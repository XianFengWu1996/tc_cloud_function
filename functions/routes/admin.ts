import express from 'express';
import { checkFirebaseToken, checkTokenInCookie } from '../middleware/auth'
import * as adminController from '../controller/admin'

export const admin = express.Router();

admin.post('/login', checkFirebaseToken, adminController.login);

admin.get('/store', checkTokenInCookie, adminController.getStoreData)

export default admin;
