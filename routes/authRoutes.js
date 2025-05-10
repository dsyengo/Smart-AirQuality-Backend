import express from "express";
import { login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyAccount } from "../controllers/authController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', userAuth, logout)
router.post('/sendOtp', userAuth, sendVerifyOtp)
router.post('/verifyAccount', userAuth, verifyAccount)
router.post('/sendResetOtp', sendResetOtp)
router.post('/resetPassword', resetPassword)

export default router