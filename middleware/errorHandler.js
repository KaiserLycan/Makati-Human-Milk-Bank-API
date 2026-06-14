import { logger } from "../utils/logger.js";

export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (statusCode === 500) {
        logger.error(`Critical server error: ${message}`, { stack: err.stack });
    } else {
        logger.warn(`Client error (${statusCode}): ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        data: null,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });

    next();
};
