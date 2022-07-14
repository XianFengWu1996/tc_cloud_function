import { Request, Response } from "express";

export const getMenu = (req: Request, res:Response) => {
    try {
        
    } catch (error) {
        res.status(400).send({ error: (error as Error).message ?? 'Failed to get menu'})
    }
}