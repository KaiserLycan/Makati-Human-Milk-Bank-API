import { GenerateAccessToken } from "../../../lib/utils/tokens.util.js";
import { ValidateCredentials } from "./auth.service.js";
import { AppError } from "../../../lib/error/appError.js";
import { APIResponse } from "../../../lib/utils/apiResponse.js";

export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await ValidateCredentials({ email, password });
    await GenerateAccessToken(res, user.user_id);
    return res.status(200).json(new APIResponse(200, user, "Logged in successfully."));
};

export const logout = async (req, res) => {
    if (!req.cookies.access_token || req.cookies.access_token === "")
        throw new AppError("User is already unauthenticated", 400);
    res.clearCookie("access_token");
    return res.status(200).json(new APIResponse(200, "Logged out successfully."));
};
