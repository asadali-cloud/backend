import { asyncHandler }  from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js"; 
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apirespones.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) =>
{
   try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken };
   } catch (error) {
    throw new ApiError(500, "Internal server error")
   }
}
const registerUser = asyncHandler(async (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        throw new ApiError(400, "Request body is missing");
    }

    const { fullName, email, password, username } = req.body;

    if ([fullName, email, password, username].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const existingUser = await User.findOne({
        $or: [{ username },{email}]})
    if (existingUser) {
        throw new ApiError(400, "User with this username or email already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    } 
    let coverTmageLocalPath;
    if (req.files && Array.isArray(req.files.coverTmage) && req.files.coverTmage.length > 0) {
        coverTmageLocalPath = req.files.coverTmage[0].path;
    }
    const avatar = await uploadOnCloud(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const coverTmage = await uploadOnCloud(coverTmageLocalPath)

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverTmage: coverTmage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "User not found");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    );
});

const loginUser = asyncHandler(async (req, res) =>{
    const {email, username, password} = req.body;
    if (!(email || username) || !password) {
        throw new ApiError(400, "All fields are required")
        
    }

    const exitedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if (!exitedUser) {
        throw new ApiError(400, "User not found")
    }
    const isPasswordCorrect = await exitedUser.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid credentials")
    }
    const { accessToken, refreshToken } = await AccessTokenAndRefreshToken(exitedUser._id)
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(200,{
            user : exitedUser, accessToken, refreshToken
        },
         "User logged in successfully",)
    )
});

const logoutUser = asyncHandler( async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingrefreshToken =req.cookies.refreshToken || req.body.refreshToken

    if (!incomingrefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodeToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingrefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is not valid")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "New Access and Refresh token generated successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})
export {registerUser, loginUser,logoutUser,refreshAccessToken}