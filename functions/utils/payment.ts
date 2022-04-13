import { Request, Response } from "express";
import { firestore } from "firebase-admin"
import { isEmpty, isString } from "lodash";
import { stripe } from "../controller/payment";

interface IPlaceOrder {
    order_id: string, 
    user_id: string,
    cart: ICart,
    customer: ICustomer,
    payment_intent_id: string,
}

export const handlePlaceOrder = async ({ order_id, user_id, cart, customer, payment_intent_id}: IPlaceOrder) => {
    let date = new Date();
    let created_at = Date.now();

    await firestore().runTransaction(async transaction => {
        let order_ref = firestore().collection('orderTest').doc(order_id);
        let user_ref = firestore().collection('usersTest').doc(user_id)

        let user = (await transaction.get(user_ref)).data() as ICustomer
        if(!user){
            throw new Error('User data not found')
        }

        // POINT REDEMPTION
        // calculate how much point should be reward to the user
        // ex: subtotal: 100, will result in 100 * 2, which is 200 point 
        let reward = Math.round(cart.subtotal * process.env.REWARD_PERCENTAGE);
        // the new point will be the old points minus the amount redeem plus the reward for this order
        let new_point_total = user.reward.points - cart.point_redemption + reward;
        let new_point_transaction = user.reward.transactions;
        // generate a transaction object for redemption only if point was redeemed
        if(cart.point_redemption > 0){
            new_point_transaction.unshift({
                type: TransactionType.redeem,
                amount: cart.point_redemption,
                order_id,
                created_at,
            });
        }
        // generate a transaction object for rewards
        new_point_transaction.unshift({
            type: TransactionType.reward,
            amount: new_point_total,
            order_id: order_id, 
            created_at,
        });

        transaction.update(user_ref, {
            reward: {
                points: new_point_total, 
                transactions: new_point_transaction
            }
        })

        let order = {
            order_id,
            user_id: user_id,
            payment_intent_id, // the payment intent stripe
            name: customer.name,
            phone: customer.phone,
            items: cart.cart,
            summary: {
                lunch_discount: cart.lunch_discount,
                discount: cart.point_redemption / 100,
                subtotal: cart.subtotal,
                tax: cart.tax,
                tip: cart.tip,
                delivery_fee: cart.is_delivery ? cart.delivery_fee : 0,
                total: cart.total,
                refund: {
                    amount: 0,
                    refund_reason: ''
                }
            },
            delivery: {
                is_delivery: cart.is_delivery,
                address: cart.is_delivery ? customer.address : {}
            },
            payment_type: cart.payment_type,
            includeUtensils: cart.includeUtensils,
            comments: cart.comments,
            date: {
                month: date.getMonth() + 1,
                day: date.getDate(),
                year: date.getFullYear(),
            }, 
            points: {
                reward,
                point_redemption: cart.point_redemption
            },
            created_at: created_at,
        }

        transaction.create(order_ref, order)            
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
        res.cookie('s_id', paymentIntent.client_secret);
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
    
    if(intent.next_action?.type === 'wechat_pay_display_qr_code'){
        throw new Error('Wechat payment unsuccessful / cancelled')
    }

    if(intent.last_payment_error){
        throw new Error(intent.last_payment_error.message)
    }

    if(intent.status !== 'succeeded'){
        throw new Error('Payment was not successful or cancelled')
    }
}