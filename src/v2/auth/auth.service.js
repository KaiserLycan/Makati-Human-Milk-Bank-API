import { prisma } from "../../../lib/db/db.ts";
import { ComparePassword } from "../../../lib/utils/passwordUtils.js";
import { AppError } from "../../../lib/error/appError.js";

export const ValidateCredentials = async ({ email, user_id, password }) => {
    let recordedUser;
    try {
        recordedUser = await prisma.user.findFirstOrThrow({
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true,
            },
            where: {
                ...(email && { email }),
                ...(user_id && { user_id }),
                status: "active",
            },
        });
    } catch (error) {
        if (error.code === "P2025") throw new AppError("Invalid Credentials", 400);
        throw error;
    }
    const { password: hashedPassword, ...user } = recordedUser;
    const isValid = await ComparePassword(password, hashedPassword);
    if (!isValid) throw new AppError("Invalid Credentials", 400);
    return user;
};
