import { Request, Response } from "express";
import axios from 'axios';
import { logger } from '../utils/logger'
import { v4 } from 'uuid' 
import { firestore } from 'firebase-admin'
import { addMinutesTounix_timestamp, hasExpire } from "../utils/time";
import { isEmpty, isEqual } from "lodash";
import { checkForValidPhoneNumber } from "../utils/validateData";
import { generateOrderEmailHTML } from '../utils/email/order_email'
import nodemailer from 'nodemailer'

interface ICodeData {
    expiration: number,
    code: number | string,
    c_id: string,
    phone_num: string,
}

export const sendMessage = async (req: Request, res: Response) => {
    try {
        checkForValidPhoneNumber(req.body.phone);

        let phone_num: string = req.body.phone;

        let code = Math.floor(Math.random() * 899999 + 100000); // generate 6 digit code
        let c_id = v4();

        // let response = await axios.post('https://api.telnyx.com/v2/messages', {
        //     "from": "+15732241462",
        //     "to": "+19175787352",
        //     "text": "Your verfication code for Taipei Cuisine is 123098. Please do not share this code."
        // },{
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Accept": "application/json",
        //         "Authorization": `Bearer ${process.env.SMS_KEY}`
        //     }
        // })

        // console.log(response.data)\

        setTimeout(() => {
            console.log(`${code} has been sent`);
        }, 2000) // remove it later, just easy to see the code sent
        
        await firestore().collection('/sms_verification').doc(c_id).set({
            c_id, 
            code,
            expiration: addMinutesTounix_timestamp(15),
            phone_num,
        })

        res.cookie('c_id', c_id, {
            maxAge: 15 * 60 * 1000,
        })

        res.status(200).send();
    } catch (error) {
        if(axios.isAxiosError(error)){
            // if axios request has failed 
            // only one request here, send a general message to notify th user
            logger.error(error.response?.data);
            return res.status(400).send({ error: 'ERR: Failed to send the message'})
        }
        // let err = (error as AxiosError)
        // console.log(err.response?.data);
        logger.error((error as Error).message);
        res.status(400).send({ error: 'ERR: Unable to complete the request'});
    }
}

export const verifyCode = async (req: Request, res: Response) => {
    try {
        // check for the cookie, required to check for the code in the backend
        if(!req.cookies.c_id){
            return res.status(401).send({ error: 'ERR: Not Authorize'});
        }

        if(!req.body.code){
            throw new Error('ERR: No code was provided')
        }

        let c_id: string = req.cookies.c_id;
        let code: string | number = req.body.code;

        // get the code data from the database
        let code_data = (await firestore().collection('/sms_verification').doc(c_id).get()).data() as ICodeData;

        // check if the code data exist 
        if(!code_data || isEmpty(code_data)){
            throw new Error('ERR: Code has either expire or not found')
        }   
        // check if the code data has expire or not
        if(hasExpire(code_data.expiration)){
            throw new Error('ERR: The code has expired')
        }

        // compare the codes        
        if(!isEqual(code_data.code.toString(), code.toString())){
            throw new Error('ERR: The code does not match');
        }

        await firestore().runTransaction(async (transaction) => {
            const sms_ref = firestore().collection('/sms_verification').doc(c_id);
            const user_ref = firestore().collection('/usersTest').doc(req.user.uid);

            transaction.delete(sms_ref)  // remove the document from firestore
            transaction.update(user_ref, {
                phone: code_data.phone_num,
            })  // update the phone and phone list
        })
        
        // remove the cookie
        res.clearCookie('c_id');

        res.status(200).send({
            phone: code_data.phone_num,
        });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'ERR: Failed to verify sms code'});
    }
}

export const sendContactMessage = async (req: Request, res: Response) => {
    try {

        const app_password = 'lzcufifwxzzrqoog'

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: 'taipeicuisine68@gmail.com', // generated ethereal user
              pass: app_password, // generated ethereal password
            },
          });

          await transporter.sendMail({
            from: '"TAIPEI CUISINE 台北风味"', // sender address
            to: "shawnwu1996@gmail.com", // list of receivers
            subject: "Order Confirmation", // Subject line
            html: generateOrderEmailHTML({
                customer_name: 'xian feng wu',
                is_delivery: true,
                payment_method: 'In Store',
                customer_phone: '9175787352',
            }),
          })
        

        res.send();
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: (error as Error).message ?? 'ERR: Failed to verify send message, please try again'});
    }
}