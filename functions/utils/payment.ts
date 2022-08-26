import { Request, Response } from "express";
import { firestore } from "firebase-admin"
import { isEmpty, isString } from "lodash";
import Stripe from "stripe";
import { stripe } from "../controller/v1/payment";
import { generateOrderEmailHTML } from "./email/order_email";
import nodemailer from 'nodemailer'
import { convert_minute_to_format_time, currentMinute, format_date, luxon_date } from "./time";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";


interface IPlaceOrder {
    user: DecodedIdToken,
    cart: ICart,
    payment_intent_id: string,
}

interface IHandleRewardPointCalculation {
    cart: ICart,
    customer:ICustomer,
}

const handleRewardPointCalculation = (_: IHandleRewardPointCalculation) => {
        const { timestamp } = format_date();

        /*
            calculate how much point should be reward to the user
            ex: subtotal: $100, will result in 100 * 2, which is 200 point = $2 at time of redemption
         */ 
        let reward = Math.round(_.cart.subtotal * Number(process.env.REWARD_PERCENTAGE));

        // the new point will be the old points minus the amount redeem plus the reward for this order
        let updated_reward_point = _.customer.reward.points - _.cart.point_redemption + reward; // original point minus the redeem amount plus the new reward amount
        let updated_reward_transactions = _.customer.reward.transactions;
        
        /*
            if point_redemption is greater than 0, it means that the customer made a redemption,
            we will want to create an new transaction object and unshift it into the transaction array
        */
        if(_.cart.point_redemption > 0){
            updated_reward_transactions.unshift({
                type: TransactionType.redeem,
                amount: _.cart.point_redemption,
                order_id: _.cart.order_id,
                created_at: timestamp,
            });
        }
        
        // generate a transaction object for the reward for this order and unshift it to the transaction array
        updated_reward_transactions.unshift({
            type: TransactionType.reward,
            amount: reward,
            order_id: _.cart.order_id, 
            created_at: timestamp,
        });

        return {
            reward_earned: reward,
            updated_reward_point, 
            updated_reward_transactions
        }
}

export const handlePlaceInstoreOrder = async ({ user, cart}: IPlaceOrder) => {
    let customer = {} as ICustomer;
    const { timestamp, date } = format_date();
 

    await firestore().runTransaction(async transaction => {
        const order_ref = firestore().collection('orderTest').doc(cart.order_id);
        const user_ref = firestore().collection('usersTest').doc(user.uid)
        const store_ref = firestore().collection('store').doc(process.env.STORE_ID);

        const store = (await store_ref.get()).data() as IStore;
        checkStoreOperatingStatus(store);

        customer = (await transaction.get(user_ref)).data() as ICustomer
        if(!customer){
            throw new Error('User data not found')
        }

        let { updated_reward_point, updated_reward_transactions, reward_earned} = handleRewardPointCalculation({
            cart, customer
        })

        transaction.update(user_ref, {
            reward: {
                points: updated_reward_point, 
                transactions: updated_reward_transactions
            }
        })

        let firestore_order = {
            order_id: cart.order_id,
            user: {
                user_id: user.uid,
                name: customer.name,
                phone: customer.phone,
            },
            payment: {
                payment_type: cart.payment_type,
                customer_id: customer.billings.stripe_customer_id,
                stripe: {
                    payment_intent_id: '',
                },
                payment_status: 'completed'
            },
            items: cart.cart,
            summary: {
                discount: {
                    lunch_discount: cart.lunch_discount,
                    point_discount: Number((cart.point_redemption / 100).toFixed(2))
                },
                cart_quantity: cart.cart_quantity,
                subtotal: cart.subtotal,
                original_subtotal: cart.original_subtotal,
                tax: cart.tax,
                tip: cart.tip,
                tip_type: cart.tip_type,
                delivery_fee: cart.is_delivery ? cart.delivery_fee : 0,
                total: cart.total,
                refund: null
            },
            delivery: {
                is_delivery: cart.is_delivery,
                address: cart.is_delivery ? customer.address : null
            },
            additional_request: {
                dont_include_utensils: cart.dont_include_utensils,
                comments: cart.comments,
                schedule_time: cart.schedule_time
            },
            date: {
                month: date.month,
                day: date.day,
                year: date.year,
            },
            points: {
                reward: reward_earned,
                point_redemption: cart.point_redemption
            },
            created_at: timestamp,
            order_status: 'required_confirmation'
        } as IFirestoreOrder

        transaction.set(order_ref, firestore_order, { merge: true})     
        
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: process.env.NODEMAILER_USER,
              pass: process.env.NODEMAILER_PASS, 
            },
          });

          await transporter.sendMail({
            from: '"TAIPEI CUISINE 台北风味"<taipeicuisine68@gmail.com>', // sender address
            to: `${user.email}`,
            subject: "Order Confirmation", // Subject line
            html: generateOrderEmailHTML(firestore_order),
          }).catch((e) => {
            console.log(e);
          })
    })

    return {
        customer
    }
} 

export const handlePlaceOnlineOrder = async ({ user, cart, payment_intent_id}: IPlaceOrder) => {
    const { timestamp, date } = format_date();

    await firestore().runTransaction(async transaction => {
        const order_ref = firestore().collection('orderTest').doc(cart.order_id);
        const user_ref = firestore().collection('usersTest').doc(user.uid)
        const store_ref = firestore().collection('store').doc(process.env.STORE_ID);

        const store = (await store_ref.get()).data() as IStore;
        checkStoreOperatingStatus(store);

        let fbUser = (await transaction.get(user_ref)).data() as ICustomer
        if(!fbUser){
            throw new Error('User data not found')
        }

        
        let firestore_order = {
            order_id: cart.order_id,
            user: {
                user_id: user.uid,
                name: fbUser.name,
                phone: fbUser.phone,
            },
            payment: {
                payment_type: cart.payment_type,
                customer_id: fbUser.billings.stripe_customer_id,
                stripe: {
                    payment_intent_id: payment_intent_id,
                },
                payment_status: 'required_payment'
            },
            items: cart.cart,
            summary: {
                discount: {
                    lunch_discount: cart.lunch_discount,
                    point_discount: Number((cart.point_redemption / 100).toFixed(2))
                },
                cart_quantity: cart.cart_quantity,
                subtotal: cart.subtotal,
                original_subtotal: cart.original_subtotal,
                tax: cart.tax,
                tip: cart.tip,
                tip_type: cart.tip_type,
                delivery_fee: cart.is_delivery ? cart.delivery_fee : 0,
                total: cart.total,
                refund: null
            },
            delivery: {
                is_delivery: cart.is_delivery,
                address: cart.is_delivery ? fbUser.address : null
            },
            additional_request: {
                dont_include_utensils: cart.dont_include_utensils,
                comments: cart.comments,
                schedule_time: cart.schedule_time
            },
            date: {
                month: date.month,
                day: date.day,
                year: date.year,
            },
            points: {
                reward: 0,
                point_redemption: cart.point_redemption
            },
            order_status: 'required_payment',
            created_at: timestamp,
        } as IFirestoreOrder

        transaction.set(order_ref, firestore_order, { merge: true }) 
    })
} 

export const getCustomerId = async (uid: string, email: string | undefined) => {
    let user_ref = firestore().collection('/usersTest').doc(uid);
    let user = (await user_ref.get()).data() as ICustomer;

    if(!user){
        throw new Error('No user found')
    }

    let customer_id = user.billings.stripe_customer_id;


    if(!user.billings.stripe_customer_id){
        let customer = await stripe.customers.create({
            email: email ?? '',
        })

        customer_id = customer.id

        user_ref.update({
            'billings.stripe_customer_id': customer.id
        })
    }

    return customer_id
}

export const handleConfirmingOrder = async (cart:ICart, user_id: string, stripe_result: Stripe.Response<Stripe.PaymentIntent>) => {
    let customer = {} as ICustomer;
    const { date, timestamp } = format_date();

    await firestore().runTransaction(async (transaction) => {
        const user_ref = firestore().collection('usersTest').doc(user_id)
        const order_ref = firestore().collection('orderTest').doc(cart.order_id);

        customer = (await transaction.get(user_ref)).data() as ICustomer;
       
        const { updated_reward_point, updated_reward_transactions, reward_earned} = handleRewardPointCalculation({cart, customer});

        transaction.update(user_ref, {
            reward: {
                points: updated_reward_point,
                transactions: updated_reward_transactions,
            }
        })
 
        // at this point, the order is already in the database and the payment is successful
        transaction.set(order_ref, {
            payment: {
                stripe: {
                    payment_intent_id: stripe_result.id,
                    payment_method: stripe_result.payment_method,
                    payment_method_type: stripe_result.charges.data[0].payment_method_details?.type,
                    card: stripe_result.charges.data[0].payment_method_details?.card ? {
                        brand: stripe_result.charges.data[0].payment_method_details?.card.brand,
                        exp_month: stripe_result.charges.data[0].payment_method_details?.card.exp_month,
                        exp_year: stripe_result.charges.data[0].payment_method_details?.card.exp_year,
                        last_4: stripe_result.charges.data[0].payment_method_details?.card.last4,
                        country: stripe_result.charges.data[0].payment_method_details?.card.country,
                    } : null
                },
                payment_status: 'completed'
            },
            date: {
                month: date.month,
                day: date.day,
                year: date.year,
            },
            summary: {
                subtotal: cart.subtotal,
                cart_quantity: cart.cart_quantity,
                original_subtotal: cart.original_subtotal,
                tax: cart.tax,
                tip: cart.tip,
                tip_type: cart.tip_type,
                total: cart.total,
            },
            points: {
                reward: reward_earned, 
                point_redemption: cart.point_redemption,
            },
            order_status: 'required_confirmation',
            created_at: timestamp,
        } as IFirestoreOrder | {}, { merge: true })
    })

    return {
        customer
    }
}

// STRIPE RELATED

export const createPaymentIntent = async (req: Request, res: Response, customer_id: string) => {
    // check for s_id in the cookie
    let s_id = req.cookies.s_id;
    // if no s_id is found, we will need to generate a new payment intent 
    if(!isString(s_id) || isEmpty(s_id)){
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            customer: customer_id, // associate the all the payment with this customer
            amount: 1000, // this is the minimum for credit card payment, but will be update during submit
            currency: "usd",
            automatic_payment_methods: {
                enabled: true
            }
        });
        // set the cookie for payment intent

        return paymentIntent.client_secret
    }
}

export const retrieveIntentFromCookie = (secret: string) => {
    let index = secret.indexOf('_secret_')
    return secret.slice(0, index);
}

export const generatePublicPaymentList = async (customer_id: string) => {
      // retrieve the payment method list from stripe for the customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer_id,
        type: 'card'
    })

    // loop through the list and generate a list of new public view payment method
    let publicPaymentMethods: IPublicPaymentMethod[] = [];
    paymentMethods.data.map((val) => {
        if(!val.card){
            throw new Error('Failed to list payment, some card information not found')
        }
        publicPaymentMethods.unshift({
            card: {
                brand: val.card.brand,
                exp_month: val.card.exp_month,
                exp_year: val.card.exp_year,
                last_four: val.card.last4
            },
            id: val.id
        })
    })

    return publicPaymentMethods
}

export const validateIntentStatus = async (payment_intent: string) => {
    if(!isString(payment_intent)){
        throw new Error('ERR: payment intent is required')
    }
 
    // check if the wallet was successful
    let intent = await stripe.paymentIntents.retrieve(payment_intent);
    

    if(intent.status !== 'succeeded'){

        if(intent.next_action?.type === 'wechat_pay_display_qr_code'){
            throw new Error('Wechat payment unsuccessful / cancelled')
        }

        if(intent.last_payment_error){
            throw new Error(intent.last_payment_error.message)
        }

        throw new Error('Payment was not successful or cancelled')
    }
}

export const checkStoreOperatingStatus = (data: IStore) => {
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
}