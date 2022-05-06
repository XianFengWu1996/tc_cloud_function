import { isBoolean, isEmpty, isNumber, isString } from 'lodash'
import validator from 'validator'

export const checkForValidDishData = (data: any) => {
    let valid_en_name = data.en_name === undefined || typeof data.en_name === 'string'
    let valid_ch_name = data.ch_name === undefined || typeof data.ch_name === 'string'
    let valid_is_spicy = data.is_spicy === undefined || typeof data.is_spicy === 'boolean'
    let valid_is_popular = data.is_popular === undefined || typeof data.is_popular === 'boolean'
    let valid_is_lunch = data.is_lunch === undefined || typeof data.is_lunch === 'boolean'
    let valid_in_stock = data.in_stock === undefined || typeof data.in_stock === 'boolean'
    let valid_price = data.price === undefined || typeof data.price === 'number'
    let valid_description = data.description === undefined || typeof data.description === 'string'
    let valid_label_id = data.label_id === undefined || typeof data.label_id === 'string'
    let valid_order = data.order === undefined || typeof data.order === 'number'
    let valid_pic_url = data.pic_url === undefined || typeof data.pic_url === 'string'
    let valid_variant = data.variant === undefined || data.variant instanceof Array

    return valid_en_name && valid_ch_name && valid_is_spicy && valid_is_popular 
        && valid_is_lunch && valid_in_stock && valid_price && valid_description 
        && valid_label_id && valid_order && valid_pic_url && valid_variant;
}

export const checkForValidPhoneNumber = (phone: string) => {
    // CHECK IF THE PHONE NUMBER IS PROVIDED AND IS STRING
    if(!isString(phone)){
        throw new Error('Missing phone number or wrong type');
    }

    // CHECK IF THE PHONE NUMBER IS A VALID US PHONE NUMBER
    if(!validator.isMobilePhone(phone, "en-US")){
        throw new Error('Not a valid US phone number');
    }
}

export const checkForValidAddress = (data: any) => {
      // check for require fields
    if(!isString(data.format_address)){
        throw new Error('Missing format address or wrong type')
    }
    if(!isString(data.place_id)){
        throw new Error('Missing place_id or wrong type')
    }
    let addr = data.address;

    if(isEmpty(addr)){
        throw new Error('Missing required address field')
    }

    if(!isString(addr.street)){
        throw new Error('Missing street or wrong type')
    }

    if(!isString(addr.city)){
        throw new Error('Missing city or wrong type')
    }

    if(!isString(addr.state)){
        throw new Error('Missing state or wrong type')
    }

    if(!isString(addr.zipcode)){
        throw new Error('Missing zipcode or wrong type')
    }
}

export const validateCustomer = (data: ICustomer) => {
    if(isEmpty(data)){
        throw new Error('ERR: Missing customer information')
    }

    if(!isString(data.name)){
        throw new Error('ERR: Missing customer name or wrong type')
    }
    
    if(!isString(data.phone)){
        throw new Error('ERR: Missing customer phone number or wrong type');
    }
}

export const validateCart = (data: ICart) => {
    if(isEmpty(data)){
        throw new Error('ERR: Missing cart information')
    }

    if(isEmpty(data.cart)){
        throw new Error('ERR: Cart is empty, please add some items')
    }

    if(!isNumber(data.cart_quantity)){
        throw new Error('ERR: Missing cart quantity or wrong type')
    }

    if(!isBoolean(data.is_delivery)){
        throw new Error('ERR: Missing is_delivery or wrong type')
    }

    if(!isNumber(data.subtotal)){
        throw new Error('ERR: Missing subtotal or wrong type')
    }

    if(!isNumber(data.delivery_fee)){
        throw new Error('ERR: Missing delivery fee or wrong type')
    }

    if(!isNumber(data.tax)){
        throw new Error('ERR: Missing tax or wrong type')
    }

    if(!isNumber(data.tip)){
        throw new Error('ERR: Missing tip or wrong type')
    }

    if(!isNumber(data.total)){
        throw new Error('ERR: Missing total or wrong type')
    }

    if(!isNumber(data.lunch_discount)){
        throw new Error('ERR: Missing lunch discount or wrong type')
    }

    if(!isNumber(data.point_redemption)){
        throw new Error('ERR: Missing point redemption or wrong type')
    }

    if(!isString(data.payment_type)){
        throw new Error('ERR: Missing payment type or wrong type')
    }
    if(!isString(data.comments)){
        throw new Error('ERR: Missing comments or wrong type')
    }
    if(!isBoolean(data.dont_include_utensils)){
        throw new Error('ERR: Missing includeUtensils or wrong type')
    }
}