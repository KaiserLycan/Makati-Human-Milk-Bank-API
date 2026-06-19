import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { fetchUserDetails } from "../services/user.services.js";
import { AppError } from "../library/classes/AppError.js";
dotenv.config();

export const protectRoute = async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) throw new AppError("User is not authenticated", 401);
    const decoded_token = jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded_token) throw new AppError("Invalid token", 401);
    req.user = await fetchUserDetails(decoded_token.user_id);
    next();
};
