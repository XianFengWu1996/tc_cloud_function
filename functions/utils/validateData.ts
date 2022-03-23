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