interface IMenu {
    id: string, 
    category: ICategory[],
    en_name: string, 
    ch_name: string,
}

interface ICategory{
    id: string, 
    ch_name: string,
    en_name: string, 
    dishes: IDish[],
    document_name: string,
    order: number,
}

interface IDish {
    id: string,
    en_name: string,
    ch_name: string,
    is_spicy:boolean,
    is_popular: boolean,
    is_lunch: boolean,
    in_stock: boolean,
    price: number,
    variant: [],
    description: string,
    label_id: string,
    order: number,
    pic_url:string,
}