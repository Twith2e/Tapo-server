import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  return jwt.sign(
    { email: user.email, displayName: user.displayName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "365d" }
  );
};

export default generateAccessToken;
