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