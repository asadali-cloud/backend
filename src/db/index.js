import mongoose, { Mongoose } from "mongoose";
import * as dotenv from 'dotenv';
import { DB_NAME } from "../constants.js";

dotenv.config(); // Load environment variables



const connected = async ()=>{
    try {
        const connectedInstance = await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`);
        console.log(`mongoose connected !! db host ${connectedInstance.connection.host}`)
    } catch (error) {
        console.log("Mongoose datebase connection failed",error.message || error);
        process.exit(1)
    }
}

export default connected;