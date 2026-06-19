import { AppError } from "../library/classes/AppError.js";
import { logger } from "../library/utils/logger.js";

export const parseFormDataJson = (req, res, next) => {
    if (!req.body.data) return next();
    try {
        req.body = JSON.parse(req.body.data);
        next();
    } catch (error) {
        logger.error("Could not parse form data", error);
        next(new AppError("Invalid JSON format in form data", 400));
    }
};
