import { NextFunction, Request, Response } from "express";
import axios from 'axios';
import validator from 'validator'
import { logger } from '../utils/logger'

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

        // console.log(response.data)

        res.send('success')
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
        res.status(400).send({ error: 'failed'})
    }
}