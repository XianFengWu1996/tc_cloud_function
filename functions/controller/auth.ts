import { Request, Response } from 'express'
import admin from 'firebase-admin'

// signing in for the user
export const Signin = async (req: Request, res: Response) => {
    try {
        await admin.firestore().runTransaction(async (transaction) => {
            const user_ref = admin.firestore().collection('/usersTest').doc(req.user.uid);
            let user_data = (await transaction.get(user_ref)).data();
            
              // if user collection does not exist, create one for the user
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
        res.status(400).send({ error: (error as Error).message ?? 'ERR: Failed to login'});
    }
}