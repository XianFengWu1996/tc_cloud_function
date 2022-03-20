import { NextFunction, Request, Response } from 'express'
// import admin from 'firebase-admin'

export const Signin = async (req: Request, res: Response, next: NextFunction) => {
    console.log('login')
    res.status(200).send('login is ran');

    // try {
    //     // sync old data to the new doc
    //     // admin.firestore().runTransaction(async (transaction) => {
    //     //     const user_ref = admin.firestore().collection('/usersTest').doc(req.user.uid);
    //     //     let user_data = transaction.get(user_ref);

    //     //     console.log((await user_data).exists)
    //     //     // if the user doc (new doc) does not exist
    //     //     if(!(await user_data).exists){
    //     //         let old_user = transaction.get(user_ref.collection('customer').doc('details'));
    //     //         let old_reward = transaction.get(user_ref.collection('reward').doc('points'));

    //     //         console.log(old_user)
    //     //         console.log(old_reward)
                
    //     //     }
    //     // })

    // } catch (error) {
    //     console.log(error);
    // }
}