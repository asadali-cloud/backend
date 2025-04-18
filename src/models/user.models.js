import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true,
        unique:true,
        lowecase:true,
        trim:true,
        index:true,
    },
    email: {
        type:String,
        required: true,
        unique:true,
        lowecase:true,
        trim:true,
    },
    fullname: {
        type:String,
        required: true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String,
        required:true,
    },
    coverTmage:{
        type:String,
    },
    watchhistry:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Video",
        }
    ],
    password:{
        type:String,
        required:true,
    },
    refreshToken:{
        type:String,
    },
},{timestamps:true})
userSchema.pre(
    "save",
    async function (next) {
        if (!this.isModified("password"))return next();
        this.password= bcrypt.hash(this.password, 10)
        next()
    }
)
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
export const User = mongoose.model("User",userSchema)