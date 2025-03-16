const jwt = require("jsonwebtoken");
const tokenModel = require("../models/refreshToken.model");

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { email: user.email, displayName: user.displayName },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  const savedToken = await tokenModel.create({ refreshToken });
  if (!savedToken)
    return res
      .status(500)
      .json({ error: "Unable to save token to db", success: false });
  return refreshToken;
};

module.exports = generateRefreshToken;
