import jwt from "jsonwebtoken";

export const generateAccessToken = async (res, user_id) => {
    const access_token = jwt.sign({ user_id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15d",
    });

    res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 24 * 60 * 60 * 1000,
    });
};
