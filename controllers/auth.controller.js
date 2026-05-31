import {prisma} from "../db/db.ts";
import {ComparePassword} from "../utils/password.util.js";
import {GenerateAccessToken, GenerateRefreshToken} from "../utils/tokens.util.js";
import jwt from "jsonwebtoken";
import {redis} from "../lib/redis.lib.js";

export const Authenticate = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUniqueOrThrow({
            where: { email },
        })

        const is_valid_password = await ComparePassword(password, user.password);

        if(!is_valid_password) throw new Error("Invalid password");

        await GenerateAccessToken(res, user.user_id);
        await GenerateRefreshToken(res, user.user_id);

        return res.status(200).json({
            user_id: user.user_id,
            user_name: user.name,
            email_add: user.email,
            phone_num: user.phone,
            role: user.role,
            account_status: user.status
        })


    }
    catch(error) {
        if (error.code === "P2025" || error.message === "Invalid password") return res.status(404).json({error: "Invalid Credentials"});
        console.log("Error in Authenticate Controller.")
        console.log(error)
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const RefreshAccessToken = async (req, res) => {
    try {
        const refresh_token = req.cookies.refresh_token;

        if(!refresh_token) return res.status(401).json({error: "Missing token."});

        const decoded_token = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        const stored_token = await redis.get(`refresh_token_${decoded_token.user_id}`);

        if(refresh_token !== stored_token) return res.status(401).json({error: "Invalid refresh token"});

        await GenerateAccessToken(res, decoded_token.user_id);

        return res.status(200).json({});
    }
    catch(error) {
        console.log("Error in Refresh Access Token controller.");
        console.log(error)
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const Logout = async (req, res) => {
    try {
        const user = req.user;
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        await redis.del(`refresh_token_${user.user_id}`);
        return res.status(200).json({message: "Successfully logged out"});
    }
    catch(error) {
        console.log("Error in Logout controller.");
        console.log(error)
        return res.status(500).json({error: "Internal Server Error"});
    }
}