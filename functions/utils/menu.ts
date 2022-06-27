import {firestore} from 'firebase-admin'

interface IFilterDishFromDoc {
    arr: firestore.QueryDocumentSnapshot<firestore.DocumentData>[],
    isFullday: boolean,
    special_dish: IDish[],
    category: ICategory[],
    dishes: IDish[],
}

export const filterDishFromDoc = (_:IFilterDishFromDoc) => {
    _.arr.map((val) => {
        let data = val.data();

        let dishes = data.dishes as IDish[];

        if(_.isFullday){
            dishes.map((dish) => {
                if(dish.is_popular){
                    _.special_dish.push(dish);
                }

                _.dishes.push(dish);
            })
        }
        
        _.category.push({
            id: data.id, 
            ch_name: data.ch_name,
            en_name: data.en_name, 
            dishes: data.dishes,
            document_name: data.document_name,
            order: data.order,
        })


        _.category.sort((a, b) => {
            return a.order - b.order;
        });
    });
}