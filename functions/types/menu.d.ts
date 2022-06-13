interface IMenu {
    id: string, 
    category: ICategory[],
    document_name: string,
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
    is_customizable: boolean,
    price: number,
    variant: IVarirant[],
    description: string,
    label_id: string,
    order: number,
    pic_url:string,
    additional_info: {
        menu: string,
        category: string,
    }
}

interface IVarirant{
    en_name: string,
    ch_name:string,
    options: {
        id: string,
        en_name: string,
        ch_name:string,
        price: number,
    }
}

interface IFile{
    fieldname: string,
    originalname: string,
    encoding: string | undefined,
    mimetype: string |undefined,
    buffer: Buffer,
    size: number
}