import { Express } from 'express'
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import cors from 'cors'


// THE EXPRESS APP FOR STORE
// export const base_app = express();
// base_app.use(helmet());
// base_app.use(cors({ 
//     origin: ['http://localhost:3000','https://5808-2603-3005-4236-2000-8015-a859-80a-2694.ngrok.io'], 
//     // origin: '*',
//     credentials: true,
// }));
// base_app.use(bodyParser.urlencoded({extended: true}));
// base_app.use(bodyParser.json());
// base_app.use(cookieParser());

export const middleware = (app: Express) => {
    app.use(helmet());
    app.use(cors({ 
        origin: ['http://localhost:3000','https://fac8-2603-3005-4236-2000-f820-d504-58bc-b45d.ngrok.io'], 
        // origin: '*',
        credentials: true,
    }));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cookieParser());
}
