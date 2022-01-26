import 'dotenv/config'
import * as functions from "firebase-functions";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import store from '../routes/store'
import admin from '../routes/admin';
import { initializeApp } from "firebase-admin";
import cookieParser from 'cookie-parser';

initializeApp()

// THE EXPRESS APP FOR ADMIN 
const adminApp = express();
adminApp.use(bodyParser.urlencoded({extended: false}));
adminApp.use(bodyParser.json());
adminApp.use(cookieParser());

adminApp.use(helmet());
adminApp.use(cors({
    origin: true,
    credentials: true,
}));

adminApp.use('/', admin);

// THE EXPRESS APP FOR STORE
const storeApp = express();
storeApp.use(bodyParser.urlencoded({extended: false}));
storeApp.use(bodyParser.json());

storeApp.use(helmet());
storeApp.use(cors({
    origin: true,
    credentials: true,
}));

storeApp.use('/', store);

exports.admin = functions.https.onRequest(adminApp);
exports.store = functions.https.onRequest(storeApp);

