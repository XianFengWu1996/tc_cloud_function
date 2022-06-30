import express from 'express'
import { checkFirebaseToken } from '../middleware/auth';
import * as paymentController from '../controller/payment'
import { firestore } from 'firebase-admin';
import { convert_minute_to_format_time, currentMinute, luxon_date } from '../utils/time';

const payment = express.Router();

// stripe payment
payment.post("/update_payment_intent", checkFirebaseToken,paymentController.updatePaymentIntent);

payment.post('/payment_method_id', checkFirebaseToken, paymentController.usePaymentMethodId)

payment.post("/pay_with_intent", checkFirebaseToken, paymentController.usePaymentIntent)

payment.get('/payment_method', checkFirebaseToken, paymentController.getSavedPaymentList)

payment.delete('/payment_method', checkFirebaseToken, paymentController.deletePaymentMethod)


// order 
payment.post("/place_online_order", checkFirebaseToken, paymentController.placeOnlineOrder);

payment.post("/place_cash_order", checkFirebaseToken, paymentController.placeCashOrder)

payment.get("/test", async(req, res) => {
    try {
        let store = await firestore().collection('store').doc(process.env.STORE_ID).get() 
        console.log(store.data())
    
        let data = store.data() as IStore;
        
        // first, check if the server is on 
        if(!data.server_is_on){
            throw new Error('Server is currently down, please check back later')
        }

        // third, check if there is a special hour on the day
        let special_hour = data.hours.special_hour.find((hour) => {
            return (hour.date.day === luxon_date.day) && (hour.date.month === luxon_date.month) && (hour.date.year === luxon_date.year)
        })

        if(special_hour){
            // checks if the store is open with the special hour
            if(!special_hour.open_for_business){
                throw new Error(`The store will close entire day on ${special_hour.date.month}/${special_hour.date.day}/${special_hour.date.year}`)
            }

            // check if the store close early
            if(currentMinute <= special_hour.open_hour || currentMinute >= special_hour.close_hour){
                throw new Error(`The special operating hours for today are ${convert_minute_to_format_time(special_hour.open_hour)} - ${convert_minute_to_format_time(special_hour.close_hour)}`)
            }
        }

        // third, check if within store operating hours
        let regular_hour = data.hours.regular_hour.find((hour) => hour.day_of_week.toLowerCase() === luxon_date.weekdayLong.toLowerCase() )
        if(regular_hour){
            // check if the store is open on the day of the week
            if(!regular_hour.open_for_business){
                throw new Error(`The store is currently close on ${regular_hour.day_of_week}`)
            }

            // if the current minute is not within the range, throw error
            if(currentMinute <= regular_hour.open_hour || currentMinute >= regular_hour.close_hour){
                throw new Error(`The operating hours are ${convert_minute_to_format_time(regular_hour.open_hour)} - ${convert_minute_to_format_time(regular_hour.close_hour)}`)
            }

        }

     
    
        res.send()
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Fail to do something'})
    }
})


export default payment;