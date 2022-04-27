import express from 'express';
import { body } from 'express-validator';
import * as storeController from '../controller/store';
import {  checkTokenInCookie } from '../middleware/auth';
import { filesUpload } from '../middleware/upload'
import { date } from '../utils/time';

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


store.get('/test', async(req, res) => {


    let new_date = date.plus({ minute: 30}).toUnixInteger()

    res.send({
        date: date.toUnixInteger(), 
        new_date
    })
})
export default store;