import { prisma } from "../db/db.ts";
import { ComparePassword } from "../utils/password.util.js";
import { GenerateAccessToken } from "../utils/tokens.util.js";
import { redis } from "../lib/redis.lib.js";

export const Authenticate = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUniqueOrThrow({
            where: { email },
        });

        if (user.status !== "active")
            res.status(401).json({
                error: "Authentication failed",
                description: "User account is no longer active.",
            });

        const is_valid_password = await ComparePassword(password, user.password);
        if (!is_valid_password) throw new Error("Invalid password");

        await GenerateAccessToken(res, user.user_id);

        return res.status(200).json({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
        });
    } catch (error) {
        if (error.code === "P2025" || error.message === "Invalid password")
            return res.status(400).json({ error: "Invalid Credentials" });
        console.log("Error in Authenticate Controller.");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const Logout = async (req, res) => {
    try {
        const user = req.user;
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        await redis.del(`refresh_token_${user.user_id}`);
        return res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
        console.log("Error in Logout controller.");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
