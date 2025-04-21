import { ApiResponse } from "../utils/apirespones.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js";

export const jwtVerify = asyncHandler(async (req, _, next ) => {
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     if (!token) {
         throw new ApiResponse(401, "Unauthorized Request")
     }
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken._id).select("-password -refreshToken")
     if (!user) {
         throw new ApiResponse(401, "Unauthorized Request")
     }
     req.user = user;
     next()
   } catch (error) {
    throw new ApiResponse(401, error?.message || "Unauthorized Request")
   }
})