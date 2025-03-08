const express = require("express");
const router = express.Router();

const {
  register,
  sendOTP,
  verifyOTP,
} = require("../controllers/users.controller");

router.post("/register", register);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;
