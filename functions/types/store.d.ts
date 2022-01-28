export {};
declare global {
    interface IStore {
        store_id: string,
        server_is_on: boolean,
        name: string,
        reward: IReward,
        hours: [IHours],
        message: IMessage,
        special_hour: [ISpecial_hour],
        primary_phone_number: string,
        sub_phone_number: [string],
        address: IAddress
    }

    interface IAddress {
        street: string,
        city: string,
        state: string,
        zipcode: string,
    }
    
    export interface IHours {
        day_of_week: string,
        open_hour: number,
        close_hour: number,
        open_for_business: boolean
    }
    
    interface ISpecial_hour {
        date: string | number,
        open_hour: number,
        close_hour: number,
        open_for_business: boolean,
    }
    
    interface IReward {
        cash: string, 
        card: string,
    }
    
    interface IMessage {
        payment_message: [string],
        maintenance_message: [string],
        update_message: [string],
        promotion_message: [string],
    }
}