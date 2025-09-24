import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
})
)// use is a middlweare in express. It is used to parse the incoming request body.

app.use(express.json({limit: '10kb'}));
app.use(urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static('public'));
app.use(cookieParser());


//routes imoprt

import userRouter from './routes/user.routes.js'

// routes declaration

app.use('/users', userRouter)


// app.listen(process.env.PORT, () => {
//     console.log(`Server is running on port ${process.env.PORT}`);   
// });
// ...existing code...

export { app }