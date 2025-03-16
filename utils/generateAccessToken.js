const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    { email: user.email, displayName: user.displayName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

module.exports = generateAccessToken;
