import { AppError } from "../library/classes/AppError.js";

export const authorize = (req, res, next) => {
    if (req.user && req.user.role !== "manager") {
        throw new AppError("You don't have permission to use this action.", 403);
    }
    next();
};
