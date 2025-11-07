import express from "express";
const router = express.Router();

import {
  register,
  sendOTP,
  verifyOTP,
  fetchUser,
  refreshToken,
} from "../controllers/users.controller.js";

router.post("/register", register);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.get("/fetch-user", fetchUser);
router.post("/refresh-token", refreshToken);

export default router;
