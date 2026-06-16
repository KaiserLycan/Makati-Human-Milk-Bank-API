import { HashPassword } from "../../../lib/utils/passwordUtils.js";
import { prisma } from "../../../lib/db/db.ts";
import { cacheData, clearCachedData, getCachedData } from "../../../config/redis.lib.js";
import { AppError } from "../../../lib/error/appError.js";
import { checkPrismaError } from "../../../lib/utils/prismaErrorChecks.js";

const omit = {
    created_at: true,
    modified_at: true,
    modified_by: true,
    password: true,
};

const system_id = "00000000-0000-0000-0000-000000000000";

const clearUserCachedData = async () => {
    const key = "users:*";
    await clearCachedData(key);
};

export const getUsers = async ({ status, role, page, limit, search, sortBy, sortOrder }) => {
    const key = `users:list:status:${status || "all"}:role:${role || "all"}:page:${page}:limit:${limit}:search:${search || ""}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
    const cachedData = await getCachedData(key);
    if (cachedData) return cachedData;

    const filter = {
        ...(status && { status }),
        ...(role && { role }),
        user_id: {
            not: system_id,
        },
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [totalUsers, users] = await prisma.$transaction([
        prisma.user.count({ where: filter }),
        prisma.user.findMany({
            where: filter,
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
            omit: omit,
        }),
    ]);

    const responseData = {
        data: users,
        meta: {
            total: totalUsers,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalUsers / limit),
        },
    };

    await cacheData(key, responseData);
    return responseData;
};

export const getUser = async (user_id) => {
    const key = `users:${user_id}`;
    const cachedData = await getCachedData(key);
    if (cachedData) return cachedData;

    const user = await prisma.user.findUnique({
        where: {
            user_id: user_id,
        },
        omit: omit,
    });

    if (!user) throw new AppError("User does not exist", 404);

    await cacheData(key, user);
    return user;
};

export const createUser = async ({
    name,
    role,
    email,
    phone,
    password,
    modified_by,
    profile_image_url,
}) => {
    try {
        const hashedPassword = await HashPassword(password);
        const userData = {
            name,
            email,
            phone,
            password: hashedPassword,
            modified_by,
            ...(role && { role }),
            profile_image_url: profile_image_url,
        };

        const newUser = await prisma.user.create({
            data: userData,
            omit: omit,
        });

        await clearUserCachedData();
        return newUser;
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }
};

export const updateUser = async ({
    user_id,
    profile_image_url,
    name,
    role,
    email,
    phone,
    modified_by,
}) => {
    try {
        const userData = {
            name,
            email,
            phone,
            modified_by,
            ...(role && { role }),
            profile_image_url: profile_image_url,
        };

        const newUser = await prisma.user.update({
            data: userData,
            where: {
                user_id: user_id,
            },
            omit: omit,
        });

        await clearUserCachedData();
        return newUser;
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }
};

export const updatePassword = async ({ password, user_id, modified_by }) => {
    const hashedPassword = await HashPassword(password);

    return prisma.user.update({
        data: {
            password: hashedPassword,
            modified_by,
        },
        where: {
            user_id,
        },
        omit: omit,
    });
};

export const updateUserStatus = async ({ user_id, status, modified_by }) => {
    const user = await prisma.user.findUniqueOrThrow({
        select: {
            status: true,
        },
        where: {
            user_id,
        },
    });

    if (user.status === status) throw new Error(`User is already ${user.status}.`);

    const updatedUser = await prisma.user.update({
        data: {
            status,
            modified_by,
        },
        where: {
            user_id,
        },
        omit: omit,
    });

    await clearUserCachedData();

    return updatedUser;
};

export const deleteUser = async ({ user_id, modified_by }) => {
    try {
        await prisma.user.update({
            data: {
                modified_by: modified_by,
            },
            where: {
                user_id: user_id,
            },
        });

        await prisma.user.delete({
            where: { user_id: user_id },
        });

        await clearUserCachedData();
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }
};
