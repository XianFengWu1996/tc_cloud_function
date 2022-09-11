import * as dotenv from "dotenv";
import express from "express";
import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";

import helmet from "helmet";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import store from "../routes/store";
import auth from "../routes/auth";
import customer from "../routes/customer";
import message from "../routes/message";
import order from "../routes/order";
import payment from "../routes/payment";

// allows the app to get environment variable from .env
dotenv.config();

initializeApp(); // initialize firebase app

// create a express app for version 1, will be version 2 later on
const app = express();
app.use("/store", store);
app.use("/auth", auth);
app.use("/payment", payment);
app.use("/customer", customer);
app.use("/message", message);
app.use("/order", order);

app.use(helmet());
app.use(
  cors({
    origin: ["https://tc-demo-v1.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.enable("trust proxy");

exports.v1 = functions.region("us-east4").https.onRequest(app);
