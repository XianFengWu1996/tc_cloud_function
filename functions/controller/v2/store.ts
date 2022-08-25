import { Request, Response } from "express";
import { firestore } from "firebase-admin";
import { generateCategoryFromDoc } from "../../utils/menu";

export const getMenu = async (req: Request, res:Response) => {
    try {
        let dishes:IDish[] = [];

        let fullday: IMenu = {
            id: process.env.FULLDAY_MENUID,
            en_name: 'Fullday',
            ch_name: '全天',
            document_name: 'fullday',
            category: []
        };

        let lunch: IMenu = {
            id: process.env.LUNCH_MENUID,
            en_name: 'Lunch',
            ch_name: '午餐',
            document_name: 'lunch',
            category: []
        }; 

        let fullday_doc = await firestore().collection('menus').doc(process.env.STORE_ID).collection('fullday').get()
        let lunch_doc = await firestore().collection('menus').doc(process.env.STORE_ID).collection('lunch').get()

        generateCategoryFromDoc({
            doc: fullday_doc.docs,
            dishes,
            category: fullday.category
        });

        generateCategoryFromDoc({
            doc: lunch_doc.docs,
            dishes,
            category: lunch.category
        });

        console.log('make a request')

        res.status(200).send({ 
            fullday,
            lunch,
            dishes
         });
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to get menu'})
    }
}