export {};

declare global {
    interface store {
        store_id: string,
        server_is_on: boolean,
        name: string,
        reward: reward,
        hours: [hours],
        message: message,
        special_hour: [special_hour],
        primary_phone_number: string,
        sub_phone_number: [string]
    }
    
    interface hours {
        day_of_week: string,
        open_hour: number,
        close_hour: number,
        open_for_business: boolean
    }
    
    interface special_hour {
        date: string | number,
        open_hour: number,
        close_hour: number,
        open_for_business: boolean,
    }
    
    interface reward {
        cash: string, 
        card: string,
    }
    
    interface message {
        payment_message: [string],
        maintenance_message: [string],
        update_message: [string],
        promotion_message: [string],
    }
}