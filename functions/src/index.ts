import * as dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";

import express from 'express'
import * as functions from "firebase-functions";
import store from '../routes/v1/store'
import auth from '../routes/v1/auth'
import customer from '../routes/v1/customer'
import message from '../routes/v1/message'
import order from '../routes/v1/order'
import payment from '../routes/v1/payment'

import { middleware } from './config/base';

// allows the app to get environment variable from .env
dotenv.config();

initializeApp() // initialize firebase app

// create a express app for version 1, will be version 2 later on
const version_1 = express();
middleware(version_1);
version_1.use('/store', store);
version_1.use('/auth', auth);
version_1.use('/payment', payment);
version_1.use('/customer', customer);
version_1.use('/message', message);
version_1.use('/order', order);

exports.v1 = functions.region('us-east4').https.onRequest(version_1);


  

