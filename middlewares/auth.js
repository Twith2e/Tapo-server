import jwt from "jsonwebtoken";
import userModel from "../models/users.model.js";
import dotenv from "dotenv";

dotenv.config();

export async function authGuard(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Missing token" });

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await userModel
      .findOne({ email: decoded.email })
      .select("_id")
      .lean();

    if (!user) return res.status(401).json({ error: "Invalid user" });

    req.user = user;
    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
