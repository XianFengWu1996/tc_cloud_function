import express from 'express';
import * as storeController from '../../controller/v2/store';
// import {  checkTokenInCookie } from '../middleware/auth';
// import { filesUpload } from '../middleware/upload'
// import { body } from 'express-validator';


const store = express.Router();

// get all the menu data, also return the store data
store.get('/menus', storeController.getMenu);

export default store;