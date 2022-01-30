import { NextFunction, Request, Response } from "express";
import { firestore } from "firebase-admin";
import { addMinutes, getTime } from 'date-fns';
import { validationResult } from "express-validator";
import admin from "firebase-admin";
import { checkForAdminStatus } from "./admin";


export const getPublicInfo = async (req: Request, res: Response, next:NextFunction) => {
    try {
        let response = await firestore().collection('store').doc(process.env.STORE_ID).get();

        let data  = response.data() as IStore;
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

export const updateStoreHour = async (req:Request, res: Response) => {
    try {
        if(!checkForAdminStatus(req.user.uid)) return res.status(401).send({ error: 'Unauthorize Request' });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        await admin.firestore().collection('/store').doc(process.env.STORE_ID).update({
            'hours': req.body.hours
        })

        res.status(200).send()
        
    } catch (error) {
        res.status(400).send({ error: (error as Error).message });
    }
}

export const updateServerStatus = async (req: Request, res:Response) => {
    if(typeof req.body.server_is_on !== 'boolean'){
        return res.status(400).send({ error: 'Please double check data, invalid data'})
    }
    admin.firestore().collection('/store').doc(process.env.STORE_ID).update({
        server_is_on: req.body.server_is_on
    }).catch((_) => {
        return res.status(400).send({ error: 'Operation failed' });
    })

    res.status(200).send();
}
