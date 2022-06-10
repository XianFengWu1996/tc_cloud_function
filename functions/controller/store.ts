import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import admin, { firestore } from "firebase-admin";
import { checkForAdminStatus } from "./admin";
import { createPersistentDownloadUrl } from '../utils/url'
import { checkForValidDishData } from '../utils/validateData'
import { v4 } from 'uuid'
import { convert_minute_to_timestamp } from "../utils/time";


export const getPublicInfo = async (req: Request, res: Response, next:NextFunction) => {
    try {
        let response = await firestore().collection('store').doc(process.env.STORE_ID).get();

        let data  = response.data() as IStore;
        res.send({
            hours: data.hours,
            special_hour: data.special_hour,
            message: data.message,
            server_is_on: data.server_is_on,
            expiration: convert_minute_to_timestamp(30)
        }); 
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to get store info' });
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
    await admin.firestore().collection('/store').doc(process.env.STORE_ID).update({
        server_is_on: req.body.server_is_on
    }).catch((_) => {
        return res.status(400).send({ error: 'Operation failed' });
    })

    res.status(200).send();
}

export const getMenuData = async(req: Request, res:Response) => {
   try {
    console.log('this is ran')
    let fulldayResult = await admin.firestore().collection('/menus').doc(process.env.STORE_ID).collection('fullday').get();
    let lunchResult = await admin.firestore().collection('/menus').doc(process.env.STORE_ID).collection('lunch').get();
    let fullday: IMenu = {
        id: process.env.FULLDAY_MENUID,
        en_name: 'Fullday',
        ch_name: '全天',
        category: []
    } ;
    let lunch: IMenu = {
        id: process.env.LUNCH_MENUID,
        en_name: 'Lunch',
        ch_name: '午餐',
        category: []
    };

    let special: IMenu = {
        id: process.env.SPECIAL_MENUID,
        en_name: 'Most Popular',
        ch_name: '推荐菜',
        category: []
    }

    // create a category for this menu, will be the only category
    special.category.push({
        dishes: [],
        id: process.env.SPECIAL_CATEGORYID, 
        ch_name: '推荐菜',
        en_name: 'Most Popular', 
        document_name: '',
        order: 0,
    })
    
    fulldayResult.docs.map((val) => {
        let data = val.data();

        let dishes: IDish[] = data.dishes;
        dishes.map((dish) => {
            if(dish.is_popular){
                special.category[0].dishes.push(dish);
            }
        })
        
        fullday.category.push({
            id: data.id, 
            ch_name: data.ch_name,
            en_name: data.en_name, 
            dishes: data.dishes,
            document_name: data.document_name,
            order: data.order,
        })

        fullday.category.sort((a, b) => {
            return a.order - b.order;
        });
    });

    lunchResult.docs.map((val) => {
        let data = val.data();

        lunch.category.push({
            id: data.id, 
            ch_name: data.ch_name,
            en_name: data.en_name, 
            dishes: data.dishes,
            document_name: data.document_name,
            order: data.order,
        })

        lunch.category.sort((a, b) => {
            return a.order - b.order;
        });
    });

    res.status(200).send({ 
        fullday, 
        lunch, 
        special, 
        // expiration: convert_minute_to_timestamp(15)
        expiration: convert_minute_to_timestamp(15)
    });
   } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to get menu' })
   }
}

export const updateMenu = async(req: Request, res: Response) => {
    try {
        // CHECK FOR ALL REQUIRED DATA
        let menu_name = '';
        if(req.query.menuId === process.env.FULLDAY_MENUID)  menu_name = 'fullday'
        if(req.query.menuId === process.env.LUNCH_MENUID) menu_name = 'lunch'

        if(!req.query.category_name) {throw new Error('Category name must be provided')}
        if(menu_name.length === 0) throw new Error('Menu id does not match')
        if(!req.params.dishId) throw new Error('Dish id is not provided')
        if(!req.body.difference) throw new Error('No update required')
        
        if(!checkForValidDishData(req.body.difference)){
            throw new Error('Dish data is not valid')
        }

        let doc_ref = admin.firestore().collection('menus').doc(process.env.STORE_ID).collection(menu_name).doc(`${req.query.category_name}`);

        await admin.firestore().runTransaction(async (transaction) => {
            // search the database for the specific dish
            let categoryDoc = (await transaction.get(doc_ref)).data();

            // if the doc is found
            if(categoryDoc){
                let dishes: IDish[] = categoryDoc.dishes;
                let targetIndex = dishes.findIndex((dish) => dish.id === req.params.dishId);
    
                let newObj = {
                    ...dishes[targetIndex],
                    ...req.body.difference
                }
    
                dishes[targetIndex] = newObj;
                 
                transaction.update(doc_ref, { dishes });
            }
        })
        res.status(200).send();
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to update dish'})
    }
}

export const uploadImage = async(req: Request, res:Response) => {

    try {
        const tempFileName = `${v4()}.jpg`;
        // Since the multer middleware does not work with cloud function, 
        // the functions need to run through a middleware to gather the raw data and convert it into req.body.file
   
        // the file will be available as req.body.file 
        let file = req.body.file as IFile;

        // all the images related to the menu will be place into the menu bucket
        const bucket = admin.storage().bucket('taipeicuisine_menu');

        // the file name will be the original file name that was passed from the client side
        const bucket_file = bucket.file(tempFileName);

        // save the file to the cloud storage
        await bucket_file.save(file.buffer);

        // generate a public url for the image
        res.status(200).send({ url: createPersistentDownloadUrl(bucket.name, tempFileName, v4()) });
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: (error as Error).message ?? 'Failed to upload image' })
    }
}


// for own use purpose only
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
//                 pic_url: '',
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
//         await admin.firestore().collection(`menus/${process.env.STORE_ID}/lunch`).doc(el.document_name).set(
//             el
//         )
//     })


//     res.send(temp);
// }
