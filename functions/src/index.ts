import 'dotenv/config'
import { initializeApp } from "firebase-admin";

import express from 'express'
import * as functions from "firebase-functions";
import store from '../routes/store'
import admin from '../routes/admin';
import auth from '../routes/auth';
import payment from '../routes/payment';
import { middleware } from './config/base';


initializeApp()

export const base_app = express();


// THE EXPRESS APP FOR ADMIN 
const admin_app = express();
middleware(admin_app);
admin_app.use('/', admin);

const store_app = express();
middleware(store_app);
store_app.use('/', store);

const auth_app = express();
middleware(auth_app);
auth_app.use('/', auth);

const payment_app = express();
middleware(payment_app)
payment_app.use('/', payment)

exports.admin = functions.region('us-east4').https.onRequest(admin_app);
exports.store = functions.region('us-east4').https.onRequest(store_app);
exports.auth = functions.region('us-east4').https.onRequest(auth_app);
exports.payment = functions.region('us-east4').https.onRequest(payment_app);

  

