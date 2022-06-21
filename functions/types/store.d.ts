interface IStore {
    hours: {
        regular_hour: IHours[],
        special_hour: ISpecialHour[],
    },
    message: IMessage,
    server_is_on: boolean,
    store_summary: {
        name: string,
        primary_phone_number: string,
        sub_phone_number: [string], 
        address:IAddress
   }
}

interface IAddress {
    street: string,
    city: string,
    state: string,
    zipcode: string,
}

interface IHours {
    day_of_week: string,
    open_hour: number,
    close_hour: number,
    open_for_business: boolean
}

interface ISpecialHour extends IHours{
    date: string | number,
}

interface IMessage {
    payment_message: [string],
    maintenance_message: [string],
    update_message: [string],
    promotion_message: [string],
}