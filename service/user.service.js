import { HashPassword } from "../utils/password.util.js";
import { prisma } from "../db/db.ts";

export const createUser = async ({ name, role, email, phone, password, modified_by }) => {
    const hashedPassword = await HashPassword(password);
    return prisma.user.create({
        data: {
            name: name,
            email: email,
            phone: phone,
            role: role ? role : "staff",
            password: hashedPassword,
            modified_by: modified_by,
        },
        omit: {
            modified_by: true,
            modified_at: true,
            created_at: true,
            password: true,
        },
    });
};

export const updatePassword = async ({ password, user_id, modified_by }) => {
    const hashedPassword = await HashPassword(password);
    return prisma.user.update({
        data: {
            password: hashedPassword,
            modified_by: modified_by,
        },
        where: {
            user_id: user_id,
        },
        omit: {
            modified_by: true,
            modified_at: true,
            created_at: true,
            password: true,
        },
    });
};

export const updateUserStatus = async ({ user_id, status, modified_by }) => {
    const user = await prisma.user.findUniqueOrThrow({
        select: {
            status: true,
        },
        where: {
            user_id: user_id,
        },
    });

    if (user.status === status) throw new Error(`User is already ${user.status}.`);

    return prisma.user.update({
        data: {
            status: status,
            modified_by: modified_by,
        },
        where: {
            user_id: user_id,
        },
        omit: {
            modified_by: true,
            modified_at: true,
            created_at: true,
            password: true,
        },
    });
};
