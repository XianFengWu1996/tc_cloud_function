interface ICart{
    order_id: string,
    cart: ICartItem[],
    cart_quantity: number,
    original_subtotal:number,
    subtotal: number,
    delivery_fee: number,
    tip: number,
    tax: number,
    total: number,

    point_redemption: number,
    lunch_discount: number,

    is_delivery: boolean,
    tip_type: string,
    payment_type: string,
    comments: string, 
    dont_include_utensils: boolean,
}

interface ICartItem {
    id: string,
    dish: IDish,
    option: IVarirantOption,
    comment: string,
    quantity: number,
    total: number,
}

interface IVarirantOption {
    id: string,
    en_name: string,
    ch_name:string,
    price: number,
    spicy: boolean,
}

interface IFirestoreOrder {
    order_id: string, 
    user_id: string, 
    name: string,
    phone: string,
    items: ICartItem[],
    summary: {
        discount: {
            lunch_discount: number,
            point_discount: number,
        },
        subtotal: number,
        original_subtotal: number, // need to use this to recalculate the total if we remove lunch discount
        tax: number,
        tip: number,
        delivery_fee: number, 
        total: number,
        refund: {
            amount: number,
            refund_reason: '',
        }
    },
    delivery: {
        is_delivery: boolean,
        address: IAddress | {},
    },
    payment: {
        payment_type: string,
        payment_intent_id: string,
        customer_id: string,
    },
    dont_include_utensils: boolean,
    comments: string,
    date: {
        month: number,
        day: number,
        year: number
    },
    points: {
        reward: number,
        point_redemption: number,
    },
    status: 'completed' | 'required_payment',
    created_at: number
    
}