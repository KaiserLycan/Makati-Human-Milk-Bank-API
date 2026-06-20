import { prisma } from "../library/db/db.ts";
import { getTotalVolume, validateCollectionsForPooling } from "./rawMilk.services.js";
import { omit } from "../configuration/constants.js";
import { AppError } from "../library/classes/AppError.js";
import { startOfToday } from "date-fns";
import { buildStaffNotifications, notifyStaff } from "./notification.services.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";

const POOL_CACHE_KEY = "pools:*";

export const markExpiredPoolMilk = async () => {
    const expiredMilk = await prisma.pool_milk.findMany({
        where: { expiration_date: { lt: startOfToday() }, milk_status: "good" },
        select: { pid: true },
    });

    if (expiredMilk.length > 0) {
        const ids = expiredMilk.map((milk) => milk.pid);
        await prisma.pool_milk.updateMany({
            where: { pid: { in: ids } },
            data: { milk_status: "expired" },
        });

        await notifyStaff(
            buildStaffNotifications(
                "Pool Milk",
                ids,
                (id) => `Pooled milk (PID: ${id}) has expired`,
            ),
        );
    }
};

export const getMilkPools = async (params) => {
    const { milk_status, qat_status, page, limit, sortBy, sortOrder } = params;
    const key = `pools:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
        ...(milk_status && { milk_status }),
        ...(qat_status && { qat_status }),
    };

    const [total, pools] = await prisma.$transaction([
        prisma.pool_milk.count({ where }),
        prisma.pool_milk.findMany({
            where,
            include: {
                pooled_by_user: {
                    select: {
                        user_id: true,
                        name: true,
                    },
                },
            },
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            omit,
        }),
    ]);

    const responseData = {
        data: pools.map(({ pooled_by_user, ...pool }) => ({
            ...pool,
            pooled_by: pooled_by_user,
        })),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };

    await cacheData(key, responseData);
    return responseData;
};

export const getMilkPool = async (pid) => {
    const key = `pools:${pid}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const { pooled_by_user, ...pool } = await prisma.pool_milk.findUniqueOrThrow({
        where: { pid },
        include: {
            raw_milk: {
                select: {
                    ctn: true,
                    donor: {
                        select: {
                            dtn: true,
                            name: true,
                        },
                    },
                    expiration_date: true,
                    milk_status: true,
                },
            },
            pooled_by_user: {
                select: {
                    user_id: true,
                    name: true,
                },
            },
        },
        omit,
    });

    const response = {
        ...pool,
        pooled_by: pooled_by_user,
    };

    await cacheData(key, response);
    return response;
};

export const createMilkPool = async (data) => {
    const { collections, actual_volume, pooled_by, modified_by, remarks } = data;
    const validCollections = await validateCollectionsForPooling(collections);
    const expiration_date = new Date(
        Math.min(...validCollections.map((c) => new Date(c.expiration_date).getTime())),
    );
    const expected_volume = getTotalVolume(validCollections);

    return prisma.$transaction(async (tx) => {
        const createdPool = await tx.pool_milk.create({
            data: {
                expected_volume_ml: expected_volume,
                actual_volume_ml: actual_volume,
                pooled_by,
                modified_by,
                expiration_date,
                remarks,
            },
            omit,
        });

        await tx.raw_milk.updateMany({
            where: { ctn: { in: collections } },
            data: { pid: createdPool.pid, modified_by },
        });

        await clearCachedData(POOL_CACHE_KEY);
        return createdPool;
    });
};

export const updateMilkPool = async (pid, data) => {
    const updatedPool = await prisma.pool_milk.update({
        where: { pid },
        data,
        omit,
    });
    await clearCachedData(POOL_CACHE_KEY);
    return updatedPool;
};

export const deleteMilkPool = async (pid) => {
    await prisma.pool_milk.delete({ where: { pid } });
    await clearCachedData(POOL_CACHE_KEY);
};

export const updateQATStatus = async (pid, qat_status, modified_by) => {
    const milkPool = await prisma.pool_milk.findUniqueOrThrow({
        where: { pid },
        select: { qat_status: true },
    });

    if (milkPool.qat_status === qat_status) {
        throw new AppError(`Milk pool ${pid} is already ${qat_status}`, 400);
    }

    return prisma.pool_milk.update({
        where: { pid },
        data: { qat_status, modified_by },
        omit,
    });
};

export const updateMilkPoolStatus = async (pid, milk_status, remarks, modified_by) => {
    const milkPool = await prisma.pool_milk.findUniqueOrThrow({
        where: { pid },
        select: { milk_status: true },
    });

    if (milkPool.milk_status === milk_status) {
        throw new AppError(`Milk pool ${pid} is already marked as ${milk_status}`, 400);
    }

    return prisma.$transaction(async (tx) => {
        const updatedMilkPool = await tx.pool_milk.update({
            where: { pid },
            data: { milk_status, remarks, modified_by },
        });

        await tx.raw_milk.updateMany({
            where: { pid },
            data: { modified_by, milk_status, remarks },
        });

        await clearCachedData(POOL_CACHE_KEY);
        return updatedMilkPool;
    });
};
