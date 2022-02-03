import { NextFunction, Request, Response } from "express";
import { addMinutes, getTime } from 'date-fns';
import { validationResult } from "express-validator";
import admin, { firestore } from "firebase-admin";
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

// interface ICategory{
//     id: string, 
//     ch_name: string,
//     en_name: string, 
//     dishes: INewDish[],
//     document_name: string,
//     order: number,
// }

// interface IOldDish {
//     spicy: boolean,
//     food_name_chinese: string,
//     food_id: string,
//     food_name: string,
//     active: boolean,
//     price: number,
//     lunch?: boolean,
//     options: []
// }

// interface INewDish {
//     id: string,
//     en_name: string,
//     ch_name: string,
//     is_spicy:boolean,
//     is_popular: boolean,
//     is_lunch: boolean,
//     in_stock: boolean,
//     price: number,
//     variant: [],
//     description: string,
//     label_id: string,
//     order: number,
// }
// export const transferMenuData = async (req: Request, res: Response) => {
//     let response = await admin.firestore().collection('menu/lunch/details').get();
//     let temp: ICategory[] = [];

//     response.forEach((doc) => {
//         let data = doc.data();
//         let newDish:INewDish[] = [];

//         let oldDishes:IOldDish[] = data.dishes;

//         oldDishes.forEach((dish, index) => {
//             newDish.push({
//                 id: v4(),
//                 en_name: dish.food_name,
//                 ch_name: dish.food_name_chinese,
//                 is_spicy: dish.spicy,
//                 is_popular: false,
//                 is_lunch: dish.lunch ?? false,
//                 in_stock: dish.active,
//                 price: dish.price,
//                 variant: [],
//                 description: '',
//                 label_id: dish.food_id,
//                 order: index + 1,
//             })
//         })

        
        
//         temp.push({
//             id: v4(),
//             en_name: data.englishName,
//             ch_name: data.chineseName,
//             dishes: newDish,
//             order:  0,
//             document_name: data.document_name
//         })
//     })

//     temp.forEach(async (el) => {
//         await admin.firestore().collection(`menus/backup/lunch`).doc(el.document_name).set({
//             el
//         })
//     })


//     res.send(temp);
// }
