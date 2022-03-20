import 'dotenv/config'
import { initializeApp } from "firebase-admin";

import * as functions from "firebase-functions";
import store from '../routes/store'
import admin from '../routes/admin';
import auth from '../routes/auth';
import { base_app } from './config/base';

initializeApp()

// THE EXPRESS APP FOR ADMIN 
const admin_app = base_app;
admin_app.use('/', admin);

const store_app = base_app;
store_app.use('/', store);

const auth_app = base_app;
auth_app.use('/', auth);

exports.admin = functions.region('us-east4').https.onRequest(admin_app);
exports.store = functions.region('us-east4').https.onRequest(store_app);
exports.auth = functions.region('us-east4').https.onRequest(auth_app);

  

