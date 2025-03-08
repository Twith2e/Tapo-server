require("dotenv").config();
const redisClient = require("../config/redis.connection");
const crypto = require("crypto");
const userModel = require("../models/users.model");
const mailer = require("nodemailer");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

async function createTransporter() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    if (!accessToken) {
      console.error("Access token not available");
      return;
    }
    const transporter = mailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "abdulbasitadebajo1619@gmail.com",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: process.env.GOOGLE_ACCESS_TOKEN,
      },
    });
    return transporter;
  } catch (error) {
    throw error;
  }
}
async function sendEmail(recipient, message, subject) {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: "temiladeabdulbasit2002@gmail.com",
      to: recipient,
      subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    if (!info) return false;
    return true;
  } catch (error) {
    console.log("Error sending mail", error);
    return false;
  }
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function storeOTP(email, otp, expiry = 300) {
  redisClient.setEx(`otp:${email}`, expiry, otp);
}

const sendOTP = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
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
      return res.status(200).json({ message: "Profile created successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Invalid email" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { register, sendOTP, verifyOTP };
