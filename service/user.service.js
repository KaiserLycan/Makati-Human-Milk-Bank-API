import { HashPassword } from "../utils/password.util.js";
import { prisma } from "../db/db.ts";
import { redis } from "../lib/redis.lib.js";

const clearUserListCaches = async () => {
    let cursor = "0";
    do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", "users:list:*", "COUNT", 100);

        cursor = nextCursor;

        if (keys.length > 0) {
            await redis.del(keys);
        }
    } while (cursor !== "0");
};

export const getUsers = async ({
    status,
    role,
    page = 1,
    limit = 15,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
}) => {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const cache = `users:list:status:${status || "all"}:role:${role || "all"}:page:${parsedPage}:limit:${parsedLimit}:search:${search || ""}:sortBy:${sortBy}:sortOrder:${sortOrder}`;

    const cachedData = await redis.get(cache);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const filter = {
        ...(status && { status }),
        ...(role && { role }),
    };

    if (search) {
        filter.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const orderBy = {
        [sortBy]: sortOrder,
    };

    const [totalUsers, users] = await prisma.$transaction([
        prisma.user.count({ where: filter }),
        prisma.user.findMany({
            where: filter,
            orderBy,
            skip: (parsedPage - 1) * parsedLimit,
            take: parsedLimit,
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true,
                password: true,
            },
        }),
    ]);

    const responseData = {
        data: users,
        meta: {
            total: totalUsers,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(totalUsers / parsedLimit),
        },
    };

    await redis.set(cache, JSON.stringify(responseData), "EX", 3600);
    return responseData;
};

export const createUser = async ({ name, role, email, phone, password, modified_by }) => {
    const hashedPassword = await HashPassword(password);

    const userData = {
        name,
        email,
        phone,
        password: hashedPassword,
        modified_by,
        ...(role && { role }),
    };

    const newUser = await prisma.user.create({
        data: userData,
        omit: {
            modified_by: true,
            modified_at: true,
            created_at: true,
            password: true,
        },
    });

    await clearUserListCaches();

    return newUser;
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
        omit: {
            modified_by: true,
            modified_at: true,
            created_at: true,
            password: true,
        },
    });

    await clearUserListCaches();

    return updatedUser;
};
