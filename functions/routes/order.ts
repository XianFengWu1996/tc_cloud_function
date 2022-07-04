import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as orderController from '../controller/order'

const order = express.Router();


/* ============================
    Placing Order
==============================*/

// 
order.post("/place_online_order", checkFirebaseToken, orderController.placeOnlineOrder);

order.post("/place_instore_order", checkFirebaseToken, orderController.placeInstoreOrder)

export default order;