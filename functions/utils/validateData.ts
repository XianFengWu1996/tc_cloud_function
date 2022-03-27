import { isNumber, isString } from 'lodash'
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
    // CHECK IF THE PHONE NUMBER IS PROVIDED
    if(!phone){
        throw new Error('Phone number must be provided');
    }
    // CHECK IF THE PHONE NUMBER IS STRING
    if(typeof phone !== 'string'){
        throw new Error('Please double check the phone number data type');
    }
    // CHECK IF THE PHONE NUMBER IS A VALID US PHONE NUMBER
    if(!validator.isMobilePhone(phone, "en-US")){
        throw new Error('Not a valid US phone number');
    }
}

export const checkForValidAddress = (data: any) => {
      // check for require fields
      if(!data.format_address ){
        throw new Error('Missing format address or wrong type')
    }

    if(!isString(data.format_address)){
        throw new Error('format_address must be a string')
    }

    if(!data.place_id){
        throw new Error('Missing place_id')
    }

    if(!isString(data.place_id)){
        throw new Error('Place_id must be number')
    }
    let addr = data.address;

    if(!addr){
        throw new Error('Missing required address field')
    }

    if(!addr.street || !addr.city || !addr.state || !addr.zipcode){
        throw new Error('Missing one or more required address data')
    }

    if(!isString(addr.street)){
        throw new Error('Street must be a string')
    }

    if(!isString(addr.city)){
        throw new Error('City must be a string')
    }

    if(!isString(addr.state)){
        throw new Error('State must be a string')
    }

    if(!isString(addr.zipcode)){
        throw new Error('Zipcode must be a string')
    }
}