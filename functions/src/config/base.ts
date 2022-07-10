import { Express } from 'express'
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import cors from 'cors'

export const middleware = (app: Express) => {
    app.use(helmet());
    app.use(cors({ 
        origin: ['https://tc-demo-v1.vercel.app/order'], 
        // origin: '*',
        credentials: true,
    }));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cookieParser());
}
