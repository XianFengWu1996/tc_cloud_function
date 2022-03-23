import { Request, Response } from "express";
import { checkForValidPhoneNumber } from '../utils/validateData'
import { firestore } from 'firebase-admin'

export const setDefaultPhoneNum = async (req: Request, res: Response) => {
    try {
        checkForValidPhoneNumber(req.body.phone)

        const user_ref = firestore().collection('usersTest').doc(req.user.uid);
        user_ref.update({
            phone: req.body.phone
        })

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to set default phone number'})
    }
}

export const deletePhoneNum = async (req: Request, res: Response) => {
    try {
        if(!req.body.phone){
            throw new Error('No phone numnber is provided')
        }

        let user_ref = firestore().collection('/usersTest').doc(req.user.uid);

        let phone_list: string[] = []

        await firestore().runTransaction(async (transaction) => {
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

export const updateCustomerName = async (req: Request, res: Response) => {
    try {
        if(!req.body.name){
            throw new Error('No name is provided');
        }

        await firestore().collection('/usersTest').doc(req.user.uid).update({
            name: req.body.name
        })

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to update name'})
    }
}