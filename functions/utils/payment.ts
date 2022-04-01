import { firestore } from "firebase-admin"
import { stripe } from "../controller/payment"

export const updatePaymentIntent =  async (s_id:string, total:number) => {
    if(!s_id){
        throw new Error('ERR: s_id is not avaiable')
    }

    if(!total){
        throw new Error('ERR: total is required ')
    }

    if(typeof total !== 'number'){
        throw new Error('ERR: total must be a number')
    }

    // filter out the payment intent id from the client secret
    let index = s_id.indexOf('_secret_')
    let payment_intent_id = s_id.slice(0, index);
    
    stripe.paymentIntents.update(payment_intent_id, {
        amount: Number((total * 100).toFixed(0))
    })

    return payment_intent_id
}

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
            created_at: created_at,
        }

        transaction.create(order_ref, order)            
    })
} 