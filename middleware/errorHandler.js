import { logger } from "../library/utils/logger.js";
import { checkPrismaError } from "../library/utils/prismaErrorChecks.js";

export const globalErrorHandler = (err, req, res, next) => {
    let error = err;

    try {
        checkPrismaError(error);
    } catch (prismaAppError) {
        error = prismaAppError;
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    if (statusCode === 500) {
        logger.error(`Critical server error: ${message}`, { stack: error.stack });
    } else {
        logger.warn(`Client error (${statusCode}): ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        data: null,
        ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    });
};
