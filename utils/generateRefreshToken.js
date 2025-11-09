import jwt from "jsonwebtoken";
import tokenModel from "../models/refreshToken.model.js";
import dotenv from "dotenv";
dotenv.config();

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { email: user.email, displayName: user.displayName },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "365d" }
  );
  const savedToken = await tokenModel.create({ refreshToken });
  if (!savedToken)
    return res
      .status(500)
      .json({ error: "Unable to save token to db", success: false });
  return refreshToken;
};

export default generateRefreshToken;
