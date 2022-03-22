import { NextFunction, Request, Response } from "express";
import axios from 'axios';
import validator from 'validator'
import { logger } from '../utils/logger'
import { v4 } from 'uuid' 
import admin from 'firebase-admin'
import { minutesToMilliseconds } from "date-fns";
import { addMinutesToTimestamp, hasExpire } from "../utils/time";
import { isEmpty, isEqual } from "lodash";
import { user } from "firebase-functions/v1/auth";

interface ICodeData {
    expiration: number,
    code: number | string,
    c_id: string,
    phone_num: string,
}

const checkForValidPhoneNumber = (phone: string) => {
    // CHECK IF THE PHONE NUMBER IS PROVIDED
    if(!phone){
        throw new Error('Phone number must be provided');
    }
    // CHECK IF THE PHONE NUMBER IS STRING
    if(typeof phone !== 'string'){
        throw new Error('Please double check the phone number data type');
    }
    // CHECK IF THE PHONE NUMBER IS A VALID US PHONE NUMBER
    if(!validator.isMobilePhone(phone, "en-US")){
        throw new Error('Not a valid US phone number');
    }
}

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // CHECK IF THE PHONE NUMBER IS PROVIDED
        if(!req.body.phone_number){
            return res.status(400).send({ error: 'Phone number must be provided'});
        }
        // CHECK IF THE PHONE NUMBER IS STRING
        if(typeof req.body.phone_number !== 'string'){
            return res.status(400).send({ error: 'Please double check the phone number data type'});
        }

        let phone_num: string = req.body.phone_number;
        // CHECK IF THE PHONE NUMBER IS A VALID US PHONE NUMBER
        if(!validator.isMobilePhone(phone_num, "en-US")){
            return res.status(400).send({ error: 'Not a valid US phone number'})
        }

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
        }, 2000)
        
        await admin.firestore().collection('/sms_verification').doc(c_id).set({
            c_id, 
            code,
            expiration: addMinutesToTimestamp(15),
            phone_num: phone_num,
        })

        res.cookie('c_id', c_id, {
            maxAge: minutesToMilliseconds(15),
        })

        res.status(200).send();
    } catch (error) {
        if(axios.isAxiosError(error)){
            // if axios request has failed 
            // only one request here, send a general message to notify th user
            logger.error(error.response?.data);
            return res.status(400).send({ error: 'Failed to send the message'})
        }
        // let err = (error as AxiosError)
        // console.log(err.response?.data);
        logger.error((error as Error).message);
        res.status(400).send({ error: 'Unable to complete the request'});
    }
}

export const verifyCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check for the cookie, required to check for the code in the backend
        if(!req.cookies.c_id){
            return res.status(401).send({ error: 'Not Authorize'});
        }

        if(!req.body.code){
            throw new Error('No code was provided')
        }

        let c_id: string = req.cookies.c_id;
        let code: string | number = req.body.code;

        // get the code data from the database
        let code_data = (await admin.firestore().collection('/sms_verification').doc(c_id).get()).data() as ICodeData;

        // check if the code data exist 
        if(!code_data || isEmpty(code_data)){
            throw new Error('Code has either expire or not found')
        }   
        // check if the code data has expire or not
        if(hasExpire(code_data.expiration)){
            throw new Error('The code has expired')
        }

        // compare the codes        
        if(!isEqual(code_data.code.toString(), code.toString())){
            throw new Error('The code does not match');
        }

        let phone_list: string[] = [];

        await admin.firestore().runTransaction(async (transaction) => {
            const sms_ref = admin.firestore().collection('/sms_verification').doc(c_id);
            const user_ref = admin.firestore().collection('/usersTest').doc(req.user.uid);

            // update the user phone data in firestore
            const user_data = (await transaction.get(user_ref)).data();

            phone_list = user_data?.phone_list ?  user_data.phone_list : [];

            phone_list.unshift(code_data.phone_num)

            transaction.delete(sms_ref)  // remove the document from firestore
            transaction.update(user_ref, {
                phone: code_data.phone_num,
                phone_list,
            })  // update the phone and phone list
        })
        
        // remove the cookie
        res.clearCookie('c_id');

        res.status(200).send({
            phone: code_data.phone_num,
            phone_list,
        });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to verify sms code'});
    }
}

export const setDefaultPhoneNum = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if(!req.body.phone){
            throw new Error('No phone number is provided')
        }

        if(!validator.isMobilePhone(req.body.phone, "en-US")){
            throw new Error('Not a valid US phone number')
        }

        const user_ref = admin.firestore().collection('usersTest').doc(req.user.uid);
        user_ref.update({
            phone: req.body.phone
        })

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to set default phone number'})
    }
}

export const deletePhoneNum = async (req: Request, res: Response, next: NextFunction) => {
    try {
        checkForValidPhoneNumber(req.body.phone);

        let user_ref = admin.firestore().collection('/usersTest').doc(req.user.uid);

        let phone_list: string[] = []

        await admin.firestore().runTransaction(async (transaction) => {
            let user_data = (await transaction.get(user_ref)).data();

            phone_list = user_data?.phone_list;

            let new_phone_list = phone_list.filter((phone) => {
                return phone !== req.body.phone
            })

            transaction.update(user_ref, { phone_list:  new_phone_list });
        })

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Fail to delete phone number'})
    }
}