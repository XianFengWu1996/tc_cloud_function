import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as orderController from '../controller/order'

const order = express.Router();


/* ============================
    Placing Order
============================== */

// will be handling all the order which are processed with credit card or wallets
order.post("/place_online_order", checkFirebaseToken, orderController.placeOnlineOrder);

// will be handling all the order which are processed in store (cash or credit card, which are not pay online)
order.post("/place_instore_order", checkFirebaseToken, orderController.placeInstoreOrder)

export default order;