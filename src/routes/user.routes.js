import express from "express";
import { loginUser, 
    registerUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentpassword, 
    getCurrentUser, 
    updateAccountDtails, 
    updateUserAvater, 
    updateUserCoverImage, 
    gettingUserChannelProfile, 
    getWatchHostory 
} from "../controllers/user.comtrollers.js";
import { uploadFields } from "../utils/multerConfig.js";
import { jwtVerify } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.post("/register", uploadFields, registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(jwtVerify, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(jwtVerify, changeCurrentpassword);
router.route("/current-user").get(jwtVerify, getCurrentUser);
router.route("/update-profile").patch(jwtVerify,updateAccountDtails );

router.route("/avatar").patch(jwtVerify, upload.single("avatar"), updateUserAvater);
router.route("/cover").patch(jwtVerify, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:user").get(jwtVerify, gettingUserChannelProfile);
router.route("/history").get(jwtVerify, getWatchHostory);

export default router;