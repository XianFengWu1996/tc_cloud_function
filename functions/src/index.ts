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
    origin: 'http://localhost:3000', 
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
    origin: 'http://localhost:3000', 
    credentials: true,
}));
storeApp.use(bodyParser.urlencoded({extended: true}));
storeApp.use(bodyParser.json());
storeApp.use(cookieParser());

storeApp.use('/', store);

exports.admin = functions.https.onRequest(adminApp);
exports.store = functions.https.onRequest(storeApp);
  

