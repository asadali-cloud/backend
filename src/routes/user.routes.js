import { Router } from "express";
import { registerUser } from "../controllers/user.comtrollers.js";
const router = Router()
router.route("/register").post(registerUser)
export default router