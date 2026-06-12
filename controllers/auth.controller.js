import { GenerateAccessToken } from "../utils/tokens.util.js";
import { ValidateCredentials } from "../service/auth.service.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await ValidateCredentials({ email, password });
        await GenerateAccessToken(res, user.user_id);
        return res.status(200).json(user);
    } catch (error) {
        if (error.code === "P2025" || error.message === "Invalid Credentials")
            return res.status(400).json({ error: "Invalid Credentials" });
        console.log("Error in Authenticate Controller.");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("access_token");
        return res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
        console.log("Error in Logout controller.");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
