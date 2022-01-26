import { NextFunction, Request, Response } from "express";
import { firestore } from "firebase-admin";
import { addMinutes, getTime } from 'date-fns';


export const getPublicInfo = async (req: Request, res: Response, next:NextFunction) => {
    try {
        let response = await firestore().collection('store').doc(process.env.STORE_ID).get();

        let data  = response.data() as store;
        res.send({
            hours: data.hours,
            special_hour: data.special_hour,
            message: data.message,
            server_is_on: data.server_is_on,
            expiration: getTime(addMinutes(Date.now(), 30)),
        }); 
    } catch (error) {
        res.status(400).send({ error: (error as Error).message });
    }

}
