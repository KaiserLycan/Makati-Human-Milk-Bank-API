import { AppError } from "../../lib/error/appError.js";

export const authorize = (req, res, next) => {
    if (req.user && req.user.role !== "manager") {
        throw AppError("You don't have permission to use this action.", 403);
    }
    next();
};
