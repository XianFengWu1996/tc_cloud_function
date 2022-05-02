import express from 'express';
import { body } from 'express-validator';
import * as storeController from '../controller/store';
import {  checkTokenInCookie } from '../middleware/auth';
import { filesUpload } from '../middleware/upload'

const store = express.Router();

store.get('/', storeController.getPublicInfo);


// ADMIN 
store.post('/hours', checkTokenInCookie, [
    body('hours').isArray({ min:7, max: 7}).withMessage('Invalid number of days'),
    body('hours.*.day_of_week').isString().trim(),
    body('hours.*.open_hour').isFloat({ min: 0, max: 1440}),
    body('hours.*.close_hour').isFloat({ min: 0, max: 1440}),
    body('hours.*.open_for_business').isBoolean(),], storeController.updateStoreHour);

store.post('/status', checkTokenInCookie, storeController.updateServerStatus);

store.get('/menus', storeController.getMenuData);

store.patch('/menus/:dishId',checkTokenInCookie, storeController.updateMenu);

store.post('/menus/image/upload', checkTokenInCookie, filesUpload, storeController.uploadImage)

export default store;






// store.get('/add_field_to_dish', async(req, res) => {
//     try {
//         let lunch: ICategory[] = []
//         // let fullday = await firestore().collection(`/menus/${process.env.STORE_ID}/fullday`).get()
//         let lunch_result = await firestore().collection(`/menus/${process.env.STORE_ID}/lunch`).get()
        
//         lunch_result.docs.map((val) => {
//             let data = val.data() as ICategory;
//             lunch.push(data);
//         })

//         lunch.map(async (_) => {
//             _.dishes.map((dish) => {
//                 dish.is_customizable = true
//             })

//             await firestore().collection(`/menus/${process.env.STORE_ID}/lunch`).doc(_.document_name).update({
//                 dishes: _.dishes
//             })

//         })

//         let fullday_result = await firestore().collection(`/menus/${process.env.STORE_ID}/fullday`).get()
//         let fullday:ICategory[] = []

//         fullday_result.docs.map((val) => {
//             let data = val.data() as ICategory;
//             fullday.push(data);
//         })

//         fullday.map(async (_) => {
//             _.dishes.map((dish) => {
//                 dish.is_customizable = true
//             })

//             await firestore().collection(`/menus/${process.env.STORE_ID}/fullday`).doc(_.document_name).update({
//                 dishes: _.dishes
//             })

//         })

//         res.send({ 
//             // lunch
//             fullday
//         })
//     } catch (error) {
//         console.log(error)
//         res.send({ error })
//     }
// })