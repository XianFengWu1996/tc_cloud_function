import express from 'express';
import * as storeController from '../controller/store';

const store = express.Router();

store.get('/', storeController.getPublicInfo);

export default store;