import { Request, Response } from "express";
import { firestore } from "firebase-admin";
import Stripe from "stripe";
import { validateCart, validateCustomer } from "../utils/validateData";
import { updatePaymentIntent } from '../utils/payment'
import { v4 } from "uuid";


export const stripe = new Stripe('sk_test_zXSjQbIUWTqONah6drD5oFvC00islas5P7', {
    apiVersion: '2020-08-27',
});

export const createPaymentIntent = async (req: Request, res: Response) => {
    try {
        if(!req.body.total){
            throw new Error('Err: Missing required field (total)')
        }

        let user = (await firestore().collection('/usersTest').doc(req.user.uid).get()).data();
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            customer: user?.billings.stripe_customer_id,
            setup_future_usage: "on_session",
            amount: req.body.total * 100,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            payment_method_options: {
                card: {
                  capture_method: 'manual',
                },
              },
        });
        // set the cookie for payment intent
        res.cookie('s_id', paymentIntent.client_secret);

        res.send();
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: (error as Error).message ?? 'Failed to create a payment intent'})
    }
}

export const confirmPaymentIntent =  async (req: Request, res: Response) => {
    try {

        let customer:ICustomer = req.body.customer;
        let cart:ICart = req.body.cart;
        // validate all the data
        validateCustomer(customer);
        validateCart(cart);

        // update payment intent is to make sure the total charge is alway up to date
        let payment_intent_id = await updatePaymentIntent(req.cookies.s_id, cart.total);

        let date = new Date();
        let createdAt = Date.now();
        let order_id = v4();

        await firestore().runTransaction(async transaction => {
            let order_ref = firestore().collection('orderTest').doc(order_id);
            let user_ref = firestore().collection('usersTest').doc(req.user.uid)

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
                    createdAt,
                });
            }
            // generate a transaction object for rewards
            new_point_transaction.unshift({
                type: TransactionType.reward,
                amount: new_point_total,
                order_id: order_id, 
                createdAt,
            });

            transaction.update(user_ref, {
                reward: {
                    points: new_point_total, 
                    transactions: new_point_transaction
                }
            })

            let order = {
                order_id,
                user_id: req.user.uid,
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
                    delivery_fee: cart.delivery_fee,
                    total: cart.total,
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
                created_at: createdAt,
            }

            transaction.create(order_ref, order)            
        })
        

        //remove the cookie (s_id) after the order completes
        res.clearCookie('s_id');
        res.send({ order_id })
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: (error as Error).message ?? 'Failed to submit order' })
    }
}