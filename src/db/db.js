import mongoose from 'mongoose';
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // console.log(`${process.env.PORT}`);
        
        console.log("Database connected successfully to", connectionInstance.connection.host);//when database is connected
        
    } catch (error) {
        console.log("MongoDB connection Failed:", error);// Error when database is not connected;
        process.exit(1);
    }
}

// console.log(connectDB());

export default connectDB;