import { asyncHandler }  from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js"; 
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apirespones.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription.models.js";

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

const changeCurrentpassword = asyncHandler(async (req, res) => {
    const { oldpassword , newpassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid credentials")
    }
    user.password = newpassword
    await user.save({ validateBeforeSave: false })
    return res.status(200)
    .json(new ApiResponse(200,{}, "Password changed successfully"))  
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDtails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required")
  }
  const user = User.findByIdAndUpdate(req.user?._id,{
    $set:{
        fullName,
        email
    }
  },{
    new:true
  }).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200, user, "User details updated successfully"))

})

const updateUserAvater = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    const avatar = await uploadOnCloud(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Avatar upload failed")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set:{
            avatar: avatar.url
        }
    },{
        new:true
    })
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required")
    }
    const coverImage = await uploadOnCloud(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Cover image upload failed")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set:{
            coverImage: coverImage.url
        }
    },{
        new:true
    })
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"))
})

const gettingUserAvatar = asyncHandler(async(req, res) => {
   const username = req.params

   if (!username?.trim()) {
    throw new ApiError(400, "Username is required")
   }
   const channel = await User.aggregate([
    {
        $match:{
            username: username?.toLowerCase()
        }
    },
    {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber",
            }
    },
    {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed",
            }
    },
    {
            $addFields:{
                SubscriptionCount:{
                    $size: "$subscriber"
                },
                subscriberCount:{
                    $size: "$subscribed"
                }, 
                isSubscribed:{
                    $cond: {
                        if: { $in: [req.user._id, "$subscriber.subscriber"] },
                        then: true,
                        else:false,
                    }
                }
            }
    },
    {
            $project:{
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1, 
                SubscriptionCount: 1,
                subscriberCount: 1,
                isSubscribed: 1,
                email: 1,
            }
    }
    
   ])

   if (!channel?.length) {
     throw new ApiError(404, "Channel does not exits")
   }
    return res
    .status(200)
    .json(new ApiResponse(
    200,
    channel[0], 
    "User avatar fetched successfully"
))
})

const getWatchHostory = asyncHandler(async ( req, res )=> {
   const user = await User.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from: "videos",
            localField: "watchhistory",
            foreignField: "_id",
            as: "watchhistory",
            pipeline:[
                {
                    $lookup:{
                        from: "users",
                        localField:"ownervideo",
                        foreignField:"_id",
                        as: "owner",
                        pipeline: [{
                            $project:{
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            }
                        }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
            ]
        }
    },
   ])
   return res
   .status(200)
   .json( new ApiResponse (
    200,
    user[0].watchhistory,
    "User watch history fetched successfully"
))
})

export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentpassword,
     getCurrentUser,
     updateAccountDtails,
     updateUserCoverImage,
     updateUserAvater,
     gettingUserAvatar,
     getWatchHostory,
    }