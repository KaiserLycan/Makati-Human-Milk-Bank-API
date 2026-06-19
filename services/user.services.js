import { comparePassword, hasPassword } from "../library/utils/password.js";
import { prisma } from "../library/db/db.ts";
import { AppError } from "../library/classes/AppError.js";
import { omit, system_id } from "../configuration/constants.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";

const USER_CACHE_KEY = "users:*";
const OMIT_PASSWORD = { ...omit, password: true };

export const fetchActiveUsers = () => {
    return prisma.user.findMany({
        where: { role: "staff", status: "active" },
    });
};

export const queryUsers = async (params) => {
    const { status, role, page, limit, search, sortBy, sortOrder } = params;
    const key = `users:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
        status,
        role,
        user_id: { not: system_id },
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            omit: OMIT_PASSWORD,
        }),
    ]);

    const results = {
        data: users,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };

    await cacheData(key, results);
    return results;
};

export const fetchUserDetails = async (user_id) => {
    const key = `users:${user_id}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const user = await prisma.user.findUniqueOrThrow({
        where: { user_id },
        omit: OMIT_PASSWORD,
    });

    await cacheData(key, user);
    return user;
};

export const registerNewUser = async (data) => {
    data.password = await hasPassword(data.password);
    const newUser = await prisma.user.create({
        data,
        omit: OMIT_PASSWORD,
    });
    await clearCachedData(USER_CACHE_KEY);
    return newUser;
};

export const updateUser = async (user_id, data) => {
    const updatedUser = await prisma.user.update({
        where: { user_id },
        data,
        omit: OMIT_PASSWORD,
    });
    await clearCachedData(USER_CACHE_KEY);
    return updatedUser;
};

export const updatePassword = async (user_id, password, modified_by) => {
    const hashedPassword = await hasPassword(password);
    return prisma.user.update({
        where: { user_id },
        data: { password: hashedPassword, modified_by },
        omit: OMIT_PASSWORD,
    });
};

export const toggleUserStatus = async (user_id, modified_by) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { user_id },
        select: { status: true },
    });

    const newStatus = user.status === "active" ? "inactive" : "active";
    const updatedUser = await prisma.user.update({
        where: { user_id },
        data: { status: newStatus, modified_by },
        omit: OMIT_PASSWORD,
    });

    await clearCachedData(USER_CACHE_KEY);
    return updatedUser;
};

export const deleteUser = async (user_id) => {
    await prisma.user.delete({ where: { user_id } });
    await clearCachedData(USER_CACHE_KEY);
};

export const validateCredentials = async ({ email, user_id, password }) => {
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { user_id }],
            status: "active",
        },
    });

    if (!user) throw new AppError("Invalid Credentials", 400);

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new AppError("Invalid Credentials", 400);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
