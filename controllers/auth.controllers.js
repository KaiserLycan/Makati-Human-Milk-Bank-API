import { generateAccessToken } from "../library/utils/token.js";
import { APIResponse } from "../library/classes/APIResponse.js";
import { validateCredentials } from "../services/user.services.js";
import { auditUserLogin, auditUserLogout } from "../services/audit.services.js";

export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await validateCredentials({ email, password });
    await generateAccessToken(res, user.user_id);
    await auditUserLogin(user.user_id);
    return res.status(200).json(new APIResponse(200, user, "Logged in successfully."));
};

export const logout = async (req, res) => {
    res.clearCookie("access_token");
    await auditUserLogout(req.user.user_id);
    return res.status(200).json(new APIResponse(200, null, "Logged out successfully."));
};
