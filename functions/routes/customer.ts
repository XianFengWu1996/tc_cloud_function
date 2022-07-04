import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as customerController from '../controller/customer'

const customer = express.Router();

// CUSTOMER
// get customer information
customer.get('/get_customer', checkFirebaseToken, customerController.getCustomerInfo);

// update the customer name
customer.patch('/update_name', checkFirebaseToken, customerController.updateCustomerName);

// get the order hisotry
customer.get('/order_history', checkFirebaseToken, customerController.getOrderHistory)

// get the reward hisotry
customer.get('/reward_history', checkFirebaseToken, customerController.getRewardHistory)


// ADDRESS
// calculate the delivery charge
customer.post('/address/calc_delivery', checkFirebaseToken, customerController.calculateDelivery)

// update apt and business
customer.patch('/address/apt_business', checkFirebaseToken, customerController.updateAptAndBusiness)

// delete the apt and business
customer.delete('/address/apt_business', checkFirebaseToken, customerController.removeAptAndBusiness)


export default customer