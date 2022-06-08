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
    schedule_time: string,
    dont_include_utensils: boolean,
}

interface ICartItem {
    id: string,
    dish: IDish,
    option: IVarirantOption | null,
    comment: string | null,
    quantity: number,
    total: number,
    lunchOption: ILunchOption | null,
    customize: ICustomize | null
}

interface ICustomizeItem {
    id: string,
    en_name: string,
    ch_name: string,
    price: number,
}

interface ICustomize {
    protein: ICustomizeItem[],
    veggie: ICustomizeItem[],
}

interface ILunchOption {
    sub: boolean,
    no_soup: boolean,
    no_rice: boolean,
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
    user: {
        user_id: string, 
        name: string,
        phone: string,
    },
    items: ICartItem[] ,
    summary: {
        discount: {
            lunch_discount: number,
            point_discount: number,
        },
        cart_quantity: number,
        subtotal: number,
        original_subtotal: number, // need to use this to recalculate the total if we remove lunch discount
        tax: number,
        tip: number,
        tip_type: string,
        delivery_fee: number, 
        total: number,
        refund: {
            amount: number,
            refund_reason: string,
        } | null
    },
    delivery: {
        is_delivery: boolean,
        address: IAddress | null,
    },
    additional_request: {
        dont_include_utensils: boolean,
        comments: string,
        schedule_time: string,
    }
    payment: {
        payment_type: 'online' | 'instore' | 'cash',
        customer_id: string,
        stripe: {
            payment_intent_id: string,
            payment_method: string,
            payment_method_type: string,
            card: {
                brand: string,
                exp_month: number,
                exp_year: number,
                last_4: string,
                country: string,
            }
        } | null,
        payment_status: 'completed' | 'required_payment',
    },
    date: {
        month: number,
        day: number,
        year: number,
    },
    points: {
        reward: number,
        point_redemption: number,
    },
    order_status: 'required_payment' | 'required_confirmation' | 'confirmed' | 'ready' | 'complete' 
    created_at: number
    
}