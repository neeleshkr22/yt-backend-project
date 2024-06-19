

import mongoose from "mongoose";
import {DB_NAME} from "../src/constants.js"



import dotenv from 'dotenv';
import connectDB from './db/index.js';  // Adjust the path as necessary

dotenv.config();

connectDB();




//First approach using iifee
/*
import express from "express"
const app = express();
//IFEES
(async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("ERROR:",error);
        process.exit(1);
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
       })
    }catch(error){
        console.error("ERROR:",error)
        
    }
})()
*/
