import { prisma } from "../db/db.ts";
import { ComparePassword } from "../utils/password.util.js";

export const ValidateCredentials = async ({ email, user_id, password }) => {
    const filter = {
        status: "active",
    };
    if (email) filter.email = email;
    if (user_id) filter.user_id = user_id;

    const { password: hashedPassword, ...user } = await prisma.user.findFirstOrThrow({
        omit: {
            created_at: true,
            modified_at: true,
            modified_by: true,
        },
        where: filter,
    });

    const isValidPassword = await ComparePassword(password, hashedPassword);
    if (!isValidPassword) throw new Error("Invalid Credentials");

    return user;
};
