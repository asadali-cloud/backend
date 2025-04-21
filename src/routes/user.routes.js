import express from "express";
import { loginUser, registerUser,logoutUser,refreshAccessToken } from "../controllers/user.comtrollers.js";
import { uploadFields } from "../utils/multerConfig.js";
import { jwtVerify } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/register", uploadFields, registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(jwtVerify, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
export default router;