import express from 'express';
import * as storeController from '../controller/store';
// import {  checkTokenInCookie } from '../middleware/auth';
// import { filesUpload } from '../middleware/upload'
// import { body } from 'express-validator';


const store = express.Router();

store.get('/menus', storeController.getMenuData);

// store.get('/remove_unactive', async (req, res) => {
//     try {
//         let users = await auth().listUsers(1000)

//         users.users.map(async user => {
//             if(user.providerData[0].providerId === 'password'){
//                 if(!user.emailVerified){
//                     console.log(user.uid)
//                     await auth().deleteUser(user.uid)
//                 }
//             }
//         })

//         res.send();
//     } catch (error) {
//         res.status(400).send();
//     }
// })


// // ADMIN 
// store.post('/hours', checkTokenInCookie, [
//     body('hours').isArray({ min:7, max: 7}).withMessage('Invalid number of days'),
//     body('hours.*.day_of_week').isString().trim(),
//     body('hours.*.open_hour').isFloat({ min: 0, max: 1440}),
//     body('hours.*.close_hour').isFloat({ min: 0, max: 1440}),
//     body('hours.*.open_for_business').isBoolean(),], storeController.updateStoreHour);

// store.post('/status', checkTokenInCookie, storeController.updateServerStatus);


// store.patch('/menus/:dishId',checkTokenInCookie, storeController.updateMenu);

// store.post('/menus/image/upload', checkTokenInCookie, filesUpload, storeController.uploadImage)


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
//                 dish.additional_info = {
//                     menu: 'lunch',
//                     category: _.document_name
//                 }
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
//                 dish.additional_info = {
//                     menu: 'fullday',
//                     category: _.document_name
//                 }
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