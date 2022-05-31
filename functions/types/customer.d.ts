export  {}

declare global {

    const enum TransactionType {
        reward = 'reward',
        redeem = 'redeem',
        refund = 'refund',
        cancel = 'cancel',
    }
    
    interface ICustomer {
        name: string,
        phone: string,
        address: IAddress,
        reward: {
            points: number,
            transactions: IRewardTransaction[]
        },
        billings: {
            stripe_customer_id: string,
        }
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
    
    interface IRewardTransaction {
        type: TransactionType,  // 'reward', 
        amount: number,
        order_id: string, 
        created_at: number,
    }

    interface IPublicPaymentMethod {
        card: {
            brand: string,
            exp_month: number,
            exp_year: number,
            last_four: string
        },
        id: string
    }
}