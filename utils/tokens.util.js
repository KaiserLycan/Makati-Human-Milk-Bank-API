import jwt, {decode} from "jsonwebtoken";
import dotenv from "dotenv";
import {redis} from "../lib/redis.lib.js";

dotenv.config();

export const GenerateAccessToken = async (res, user_id) => {
    const access_token = jwt.sign({user_id}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    })

    res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000
    })
}

export const GenerateRefreshToken = async (res, user_id) => {
    const refresh_token = jwt.sign({user_id}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "2d",
    })

    await redis.set(`refresh_token_${user_id}`, refresh_token, "EX", 2 * 24 * 60 *60)

    res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 60 * 1000
    })
}


