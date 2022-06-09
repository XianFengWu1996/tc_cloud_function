import { Request, Response } from "express";
import { checkForValidAddress } from '../utils/validateData'
import { firestore } from 'firebase-admin'
import axios from "axios";
import admin from "../routes/admin";
import { isEmpty, merge } from "lodash";

export const getCustomerInfo = async (req: Request, res: Response) => {
    try {
        // fetch the data from firestore
        let result = (await firestore().collection('/usersTest').doc(req.user.uid).get()).data();

        // handle if not result found
        if(!result){
            throw new Error('Not found')
        }

        // remove private fields
        delete result.billings
        delete result.address.place_id
        delete result.reward.transactions
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send({ error: 'ERR: Failed to retrieve user data'});
    }
}

export const updateCustomerName = async (req: Request, res: Response) => {
    try {
        if(!req.body.name){
            throw new Error('ERR: No name is provided');
        }

        await firestore().collection('/usersTest').doc(req.user.uid).update({
            name: req.body.name
        })

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: 'ERR: Failed to update name'})
    }
}

export const calculateDelivery = async (req: Request, res: Response) => {
    try {
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
                key: process.env.MAP_KEY,
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
            throw new Error('ERR: Out of the delivery boundary');
        }

        await firestore().collection('/usersTest').doc(req.user.uid).update({
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
        if(axios.isAxiosError(error)){
            return res.status(400).send({ error: 'ERR: Failed to calculate delivery fee'})
        }

        res.status(400).send({ error: (error as Error).message ?? 'ERR: Failed to set address'})
    }
}

export const updateAptAndBusiness = async (req: Request, res:Response) => {
    try {
        if(isEmpty(req.body.apt) && isEmpty(req.body.business)) {
            throw new Error('ERR: Please provide either apt or business to proceed');
        }

        const address:IAddress = req.body.address;

        await firestore().collection('/usersTest').doc(req.user.uid).set({
            address: {
                apt: isEmpty(req.body.apt) ? address.apt : req.body.apt,
                business: isEmpty(req.body.business) ? address.business : req.body.business
            }
        } as ICustomer, {merge: true})

        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Err: Failed to update apt or business'})
    }
}

export const getOrderHistory =  async (req: Request, res: Response) => {
    try {
        let orders = (await firestore().collection('/orderTest')
            .where('payment.payment_status', '==', 'completed')
            .where('user.user_id', '==', req.user.uid)
            .orderBy('created_at', 'desc')
            // .limit(8)
            .get())
            .docs;
        let order_list: any[] = [];
        orders.map((order) => {
            const data = order.data() ;
            
            // remove some private info before sending to client
            delete data.user.user_id
            delete data.payment.customer_id
            delete data.payment.stripe?.payment_intent_id,
            delete data.payment.stripe?.payment_method,
            delete data.payment.stripe?.payment_method_type,
            delete data.payment.payment_status
            delete data.order_status

            order_list.push(data)
        })

        res.status(200).send({ order_list });
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'ERR: Failed to get order history'})
    }
}

export const getRewardHistory = async (req: Request, res: Response) => {
    try {
        let user_data = (await firestore().collection('usersTest').doc(req.user.uid).get()).data() as ICustomer;

        res.status(200).send({ rewards: user_data.reward });
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'ERR: Failed to get order history'})
    }
}
