import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
})
)// use is a middlweare in express. It is used to parse the incoming request body.

appp.use(express.json({limit: '10kb'}));
express.use(urlencoded({ extended: true, limit: '10kb' }));
express.use(express.static('public'));
app.use(cookieParser());

export { app }