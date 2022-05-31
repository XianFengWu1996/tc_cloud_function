import { NextFunction, Request, Response } from 'express'
import admin from 'firebase-admin'
import { isEmpty} from 'lodash';

export const Signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await admin.firestore().runTransaction(async (transaction) => {
            const user_ref = admin.firestore().collection('/usersTest').doc(req.user.uid);
            let user_data = (await transaction.get(user_ref)).data();
            

            // sync old data to the new doc
            if(isEmpty(user_data)){
                let old_user = (await transaction.get(user_ref.collection('customer').doc('details'))).data();
                let old_reward = (await transaction.get(user_ref.collection('rewards').doc('points'))).data();

                transaction.set(user_ref, {
                    name: old_user?.customer.name  ? old_user.customer.name :'',
                    phone: old_user?.customer.phone ? old_user.customer.phone : '',
                    address: {
                        address: old_user?.address.address ? old_user?.address.address : '',
                        street:  '',
                        city: old_user?.address.city ? old_user?.address.city : '',
                        state: '',
                        zipcode: old_user?.address.zipcode ? old_user?.address.zipcode : '',
                        delivery_fee: old_user?.address.deliveryFee ? old_user.address.deliveryFee : 0,
                        business: old_user?.address.business ?  old_user?.address.business : '',
                        apt: old_user?.address.apt ? old_user?.address.apt : '',

                    },
                    billings: {
                        customer_id: old_user?.billing.customerId ? old_user.billing.customerId  :'',
                        cards: []
                    },
                    reward: {
                        points: old_reward?.point ? old_reward.point :0,
                        transactions: []
                    },
                })       
            }

              // if user collection does not exist
              if(!user_data){
                transaction.set(user_ref, {
                    name: '',
                    phone: '',
                    address: {
                        address: '',
                        street: '',
                        city: '',
                        state: '',
                        zipcode: '',
                        business: '',
                        apt: '',
                        delivery_fee: 0,
                    },
                    reward: {
                        points: 0,
                        transactions: []
                    },
                    billings: {
                        stripe_customer_id: '',
                    }                
                } as ICustomer)
            }
          
        })

        res.status(200).send();
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: 'ERR: Failed to login'});
    }
}