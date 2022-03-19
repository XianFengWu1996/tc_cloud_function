import 'dotenv/config'
import express from "express";
import { initializeApp } from "firebase-admin";

import * as functions from "firebase-functions";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';

import store from '../routes/store'
import admin from '../routes/admin';

initializeApp()

// THE EXPRESS APP FOR ADMIN 
const adminApp = express();

adminApp.use(helmet());
adminApp.use(cors({
    origin: ['http://localhost:3000', 'https://5808-2603-3005-4236-2000-8015-a859-80a-2694.ngrok.io'], 
    credentials: true,
}));

adminApp.use(bodyParser.urlencoded({extended: true}));
adminApp.use(bodyParser.json());
adminApp.use(cookieParser());




adminApp.use('/', admin);

// THE EXPRESS APP FOR STORE
const storeApp = express();
storeApp.use(helmet());
storeApp.use(cors({ 
    origin: ['http://localhost:3000','https://5808-2603-3005-4236-2000-8015-a859-80a-2694.ngrok.io'], 
    // origin: '*',
    credentials: true,
}));
storeApp.use(bodyParser.urlencoded({extended: true}));
storeApp.use(bodyParser.json());
storeApp.use(cookieParser());

storeApp.use('/', store);

exports.admin = functions.region('us-east4').https.onRequest(adminApp);
exports.store = functions.region('us-east4').https.onRequest(storeApp);
  

