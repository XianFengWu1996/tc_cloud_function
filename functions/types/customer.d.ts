interface ICustomer {
    name: string,
    phone: string,
    phone_list: string[],
    address: IAddress,
    reward: {
        points: number,
        transactions: IRewardTransaction[]
    },
}

interface IAddress {
    address: string,
    street: string,
    city: string,
    state: string,
    zipcode: string,
    business: string,
    apt: string,
    delivery_fee: number,
}

// interface IBillings {

// interface ICard {
//     id: string, 
//     card_type: string,
//     card_brand: string,
//     cardholder_name: string,
//     exp_month: number,
//     exp_year: number,
//     last_4: string,
//     billing_address: {
//         address: string,
//         city: string,
//         state: string,
//         postal_code: string,
//         country: string,
//     }
// }

interface IRewardTransaction {
    type: string,
    amount: number,
    order_id: string, 
    createdAt: number,
}