//first aproach
// require('dotenv').config({path: './.env'})

import dotenv from 'dotenv'

import connectDB from './db/db.js'

dotenv.config({
    path: './.env'
})
connectDB()








//second aproach
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