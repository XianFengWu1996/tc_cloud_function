import { Request, Response } from "express";
import { checkForValidAddress, checkForValidPhoneNumber } from '../utils/validateData'
import { firestore } from 'firebase-admin'
import axios from "axios";

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

export const calculateDelivery = async (req: Request, res: Response) => {
    try {
        console.log(req.body);
        checkForValidAddress(req.body) // validate all the fields, nothing happen if all case success

        const { format_address, place_id, address } = req.body;

        let origin_place_id='ChIJu6M8a15744kRIAABq6V-2Ew'
        // use distance matrix to calculate the distance
        let result = await axios({
            method: 'get',
            url: 'https://maps.googleapis.com/maps/api/distancematrix/json',
            params: {
                origins: `place_id:${origin_place_id}`,
                destinations: `place_id:${place_id}`,
                key: 'AIzaSyC7trHPRFicOYB05m_Ys6AaybOGTnpJqFc'
            }
        })

        // the distance between the restaurant and the location
        let distanece_km = result.data.rows[0].elements[0].distance.value;

        // convert the km to the miles
        let miles = Number((distanece_km * 0.00062137).toFixed(2));

        let delivery_fee = 0;

        // calculate fee base on the miles
        if(miles < 1.8){
            delivery_fee = 2
        } else if (miles >= 1.8 && miles <=5.8){
            delivery_fee = Math.round(miles);
        } else {
            throw new Error('Too far');
        }

        firestore().collection('/usersTest').doc(req.user.uid).update({
            address: {
                address: format_address,
                ...address,
                place_id,
                delivery_fee,
            },
        })

        res.status(200).send({ 
            address: {
                address:  format_address,
                ...address,
                delivery_fee
            } 
        })
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: (error as Error).message ?? 'Failed to set address'})
    }
}