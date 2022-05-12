import { Request, Response } from 'express';
import { firestore } from 'firebase-admin';
import { addMinutesTounix_timestamp } from '../utils/time'


export const checkForAdminStatus: (uid: string) => boolean = (uid) => {
    let admin_list = process.env.ADMIN.split(", ");

    return admin_list.includes(uid);
}

export const login = async(req: Request, res: Response) => {
    try {
        if(!checkForAdminStatus(req.user.uid)) return res.status(401).send({ error: 'Unauthorize Request' });
        
        let token = req.headers.authorization?.replace('Bearer ', '');

        res.cookie("ID_TOKEN", token , {
            secure: process.env.NODE_ENV === 'production'? true: false,
            httpOnly: true,
            maxAge: 30 * 60 * 1000,
        });

        res.status(200).send(); 
    } catch (error) {
        res.status(400).send({ error: (error as Error).message });
    }
}

export const getStoreData = async(req: Request, res: Response) => {
    try {

        if(!checkForAdminStatus(req.user.uid)) return res.status(401).send({ error: 'Unauthorize Request' });

        let response = await firestore().collection('store').doc(process.env.STORE_ID).get();
        
        let storeData = response.data();
        delete storeData!.reward
        delete storeData!.store_id
        
        res.status(200).send({ storeData: {
            ...storeData,
            expiration: addMinutesTounix_timestamp(15)
        }})
    } catch (error) {
        res.status(400).send({ error: (error as Error).message });
    }
}

