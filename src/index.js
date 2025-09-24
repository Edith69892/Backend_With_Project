//first aproach
// require('dotenv').config({path: './.env'})
// Add to the top of index.js


import dotenv from 'dotenv'

import connectDB from './db/db.js'

import { app } from './app.js';

dotenv.config({
    path: './.env'
})
connectDB()
.then(() => {

    app.listen(process.env.PORT || 5000, '0.0.0.0',() => {
        console.log(`server is running sst port ${process.env.PORT}`);
        
    } )
})
.catch((error) => {
    console.log("Mongo Db connection failed,", error);
    
})

// app.get('/', (req, res) => {
//     res.send('API is running....');
// })

app.listen(5000, () => {
    console.log('Server is running on port 5000');  
})

//second aproach
// import mongoose from 'mongoose';
// import { DB_NAME } from "./constant.js";
/*
import express from express

const app = express();

;( async() => {
    try {
        await   mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`)

        app.on("Error", (error) => {
            console.error("Error:",error);
            throw error
        })

        app.listen(process.env.port, () => {
            console.log("Server is running on port", process.env.port);//when database is connected and server is running
        })
    } catch (error) {
        console.error("Error:",error)
    }
})()
*/