import { AppError } from "../library/classes/AppError.js";
import { z } from "zod";

export const validateRequest = (schemas) => {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }

            if (schemas.query) {
                const parsedQuery = schemas.query.parse(req.query);
                Object.defineProperty(req, "query", {
                    value: parsedQuery,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            }

            if (schemas.params) {
                const parsedParams = schemas.params.parse(req.params);
                Object.defineProperty(req, "params", {
                    value: parsedParams,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            }

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationIssues = error.issues || error.errors || [];
                const errorMessage = validationIssues
                    .map((err) => {
                        let msg = err.message;
                        if (msg.toLowerCase() === "required" || msg.toLowerCase() === "invalid") {
                            const fieldName =
                                err.path && err.path.length > 0
                                    ? err.path[err.path.length - 1]
                                    : "";
                            if (fieldName) {
                                const cleanFieldName = String(fieldName)
                                    .replace(/_/g, " ")
                                    .replace(/-/g, " ");
                                const capitalized =
                                    cleanFieldName.charAt(0).toUpperCase() +
                                    cleanFieldName.slice(1);
                                msg = `${capitalized} is ${msg.toLowerCase()}`;
                            }
                        } else {
                            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
                        }
                        return msg;
                    })
                    .join(", ");

                throw new AppError(`Invalid request data: ${errorMessage}`, 400);
            }
            throw error;
        }
    };
};
