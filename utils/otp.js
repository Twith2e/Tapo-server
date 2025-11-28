import crypto from "crypto";
import { redisClient } from "../config/redis.connection.js";

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function storeOTP(email, otp, expiry = 300) {
  await redisClient.setEx(`otp:${email}`, expiry, otp);
}

export { generateOTP, storeOTP };
