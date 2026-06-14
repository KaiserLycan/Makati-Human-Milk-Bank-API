import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getUser } from "../service/user.service.js";
dotenv.config();

export const protectRoute = async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) return res.status(401).json({ error: "User is not authenticated" });
    const decoded_token = jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded_token) return res.status(401).json({ error: "Invalid token" });
    req.user = await getUser(decoded_token.user_id);
    next();
};
