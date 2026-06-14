import { AppError } from "./appError.js";

export const checkPrismaError = (error) => {
    if (error.code === "P2002") {
        let targetField = "field";

        if (error.meta?.target && Array.isArray(error.meta.target)) {
            targetField = error.meta.target[0];
        } else if (error.message) {
            const match = error.message.match(/fields:\s*\(`?([^`)]+)`?\)/);
            if (match && match[1]) {
                targetField = match[1];
            }
        }

        throw new AppError(`A user with this ${targetField} already exists`, 409);
    }

    if (error.code === "P2025") {
        throw new AppError("Not found.", 404);
    }
};
