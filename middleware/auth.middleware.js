import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../db/db.ts";
dotenv.config();

export const ProtectRoute = async (req, res, next) => {
    try {
        const access_token = req.cookies.access_token;
        if (!access_token) return res.status(401).json({ error: "User is not authenticated" });

        const decoded_token = jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET);

        if (!decoded_token) return res.status(401).json({ error: "Invalid token" });

        const user = await prisma.user.findUniqueOrThrow({
            where: { user_id: decoded_token.user_id },
            omit: {
                created_at: true,
                modified_by: true,
                modified_at: true,
                password: true,
            },
        });

        req.user = user;
        next();
    } catch (error) {
        if (error.code === "P2025" || error.name === "JsonWebTokenError")
            return res.status(401).json({ error: "Invalid token." });
        if (error.name === "TokenExpiredError")
            return res.status(401).json({ error: "Expired token." });
        console.log("Error in ProtectRoute Middleware");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error." });
    }
};
