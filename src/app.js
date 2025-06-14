import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())
//import routes 
import userRoutes from "./routes/user.routes.js";

//declaration routes
app.use("/api/v1/users", userRoutes)

export default app;