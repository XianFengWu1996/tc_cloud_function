import { NextFunction, Request, Response } from 'express';
import { auth } from 'firebase-admin'

// CHECKS IF THE ACCESS TOKEN PASS IN IS A VALID FIREBASE ACCESS TOKEN
export const checkFirebaseToken = async (req: Request, res:Response, next:NextFunction) => {
    try {
        let token = req.headers.authorization?.replace('Bearer ', '') as string;

        if(!token) throw new Error('No token provided')
    
        const decode = await auth().verifyIdToken(token);
    
        req.user = decode;
    
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send({ error: 'Unauthorize request'});
    }
}

export const checkTokenInCookie = async (req: Request, res:Response, next:NextFunction) => {
    try {
        let token = req.cookies.ID_TOKEN?.replace('Bearer ', '') as string;

        if(!token) throw new Error('No token provided')
    
        const decode = await auth().verifyIdToken(token);
    
        req.user = decode;

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send({ error: 'Unauthorize request'});
    }
}