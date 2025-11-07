import dotenv from "dotenv";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import redisClient from "../config/redis.connection.js";
import userModel from "../models/users.model.js";
import jwt from "jsonwebtoken";
import { generateOTP, storeOTP } from "../utils/otp.js";
import sendEmail from "../utils/email.js";

dotenv.config();

const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const verifiedEmail = jwt.verify(email, process.env.JWT_SECRET);
    const existingUser = await userModel.findOne({ email: verifiedEmail });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });
    const generatedOTP = generateOTP();
    const emailMessage = `The One Time Password for your Tapo account is ${generatedOTP}, it expires in 5 minutes. Please do not share this with anyone`;

    const sentMail = await sendEmail(
      verifiedEmail,
      emailMessage,
      "Verify Email"
    );
    if (!sentMail)
      return res
        .status(500)
        .json({ error: "Unable to send mail, please try again" });
    const hashedEmail = jwt.sign(verifiedEmail, process.env.JWT_SECRET);
    await storeOTP(hashedEmail, generatedOTP);
    return res.status(200).json({
      message: "Email has been sent",
      email: hashedEmail,
      hashedEmail: email,
    });
  } catch (error) {
    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });
    const generatedOTP = generateOTP();
    const emailMessage = `The One Time Password for your Tapo account is ${generatedOTP}, it expires in 5 minutes. Please do not share this with anyone`;

    const sentMail = await sendEmail(email, emailMessage, "Verify Email");
    if (!sentMail)
      return res
        .status(500)
        .json({ error: "Unable to send mail, please try again" });
    const hashedEmail = jwt.sign(email, process.env.JWT_SECRET);
    await storeOTP(hashedEmail, generatedOTP);
    return res
      .status(200)
      .json({ message: "Email has been sent", email, hashedEmail });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const { email } = req.body;
    try {
      const verifiedEmail = jwt.verify(email, process.env.JWT_SECRET);
      const storedOTP = await redisClient.get(`otp:${email}`);
      if (!storedOTP)
        return res.status(401).json({ error: "Invalid or expired otp" });
      if (storedOTP === otp) {
        const deletedOtp = await redisClient.del(`otp:${email}`);
        if (!deletedOtp)
          return res.status(500).json({ error: "An error occured" });
        return res
          .status(200)
          .json({ message: "Otp is valid", email, hashedEmail: verifiedEmail });
      }
      return res.status(401).json({ error: "Incorrect OTP" });
    } catch (error) {
      return res.status(500).json({ error: "Invalid Token" });
    }
  } catch (error) {
    console.log("verification error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const register = async (req, res) => {
  try {
    const { email, displayName } = req.body;
    if (!email || !displayName) {
      return res.status(400).json({
        error: "Missing required parameters",
        details: {
          displayName: !displayName ? "Missing display name" : null,
          email: !email ? "Missing email" : null,
        },
      });
    }
    try {
      const verifiedEmail = jwt.verify(email, process.env.JWT_SECRET);
      const existingUser = await userModel.findOne({ email: verifiedEmail });
      if (existingUser) {
        return res.status(400).json({
          error: "Email already exists",
        });
      }
      const data = {
        email: verifiedEmail,
        displayName,
      };
      const registeredUser = await userModel.create(data);
      if (!registeredUser)
        return res
          .status(400)
          .json({ error: "Unable to create profile, please try again" });
      const accessToken = generateAccessToken(registeredUser);
      const refreshToken = generateRefreshToken(registeredUser);
      console.log(accessToken);
      console.log(refreshToken);
      if (accessToken && refreshToken) {
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
        });
        return res.status(200).json({
          message: "Profile created successfully",
          success: true,
          accessToken,
          email,
        });
      } else {
        console.log("Refresh Token or Access Token is missing");
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Invalid email" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await userModel.findOne({ email: decoded });
    if (!user) return res.status(404).json({ error: "User not found" });
    const accessToken = generateAccessToken(user);
    return res.status(200).json({
      message: "Token refreshed successfully",
      success: true,
      accessToken,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ error: "Invalid token" });
  }
};

const fetchUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized: Missing or malformed Authorization header",
      });
    }
    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findOne({ email: decoded });
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.status(200).json({ status: true, user });
    } catch (error) {
      return res.status(500).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { register, sendOTP, verifyOTP, fetchUser, refreshToken };
