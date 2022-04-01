interface ICart{
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
    includeUtensils: boolean,
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