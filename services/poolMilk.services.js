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
            await buildStaffNotifications(
                "Pool Milk",
                ids,
                (id) => `Pooled milk (PID: ${id}) has expired`,
            ),
        );
    }
};

export const getMilkPools = async (params) => {
    const { milk_status, page, limit, sortBy, sortOrder } = params;
    const key = `pools:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
        ...(milk_status && { milk_status }),
    };

    const [total, pools] = await prisma.$transaction([
        prisma.pool_milk.count({ where }),
        prisma.pool_milk.findMany({
            select: {
                pid: true,
                pooled_date: true,
                pooled_by_user: {
                    select: {
                        user_id: true,
                        name: true,
                    },
                },
                raw_milk: {
                    select: {
                        ctn: true,
                        volume_ml: true,
                        expiration_date: true,
                    },
                },
                expiration_date: true,
                expected_volume_ml: true,
                actual_volume_ml: true,
                remaining_volume_ml: true,
                milk_status: true,
                remarks: true,
            },
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);

    const responseData = {
        data: pools,
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

    const pool = await prisma.pool_milk.findUniqueOrThrow({
        select: {
            pid: true,
            pooled_date: true,
            pooled_by_user: {
                select: {
                    user_id: true,
                    name: true,
                },
            },
            raw_milk: {
                select: {
                    ctn: true,
                    volume_ml: true,
                    expiration_date: true,
                },
            },
            expiration_date: true,
            expected_volume_ml: true,
            actual_volume_ml: true,
            remaining_volume_ml: true,
            milk_status: true,
            remarks: true,
        },
        where: { pid },
    });

    await cacheData(key, pool);
    return pool;
};

export const createMilkPool = async (data) => {
    const { collections, actual_volume_ml, pooled_by, modified_by, remarks } = data;
    const validCollections = await validateCollectionsForPooling(collections);
    const expiration_date = new Date(
        Math.min(...validCollections.map((c) => new Date(c.expiration_date).getTime())),
    );

    const expected_volume = getTotalVolume(validCollections);

    if (expected_volume < actual_volume_ml)
        throw new AppError(
            `Actual volume (${actual_volume_ml} ml) cannot exceed expected volume (${expected_volume} ml)`,
            400,
        );

    const pool = await prisma.$transaction(async (tx) => {
        const createdPool = await tx.pool_milk.create({
            data: {
                expected_volume_ml: expected_volume,
                actual_volume_ml: actual_volume_ml,
                remaining_volume_ml: actual_volume_ml,
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

        return createdPool;
    });

    await markExpiredPoolMilk();
    await clearCachedData(POOL_CACHE_KEY);
    return await getMilkPool(pool.pid);
};

export const updateMilkPool = async (pid, data) => {
    await prisma.pool_milk.update({
        where: { pid },
        data,
        omit,
    });

    await markExpiredPoolMilk();
    await clearCachedData(POOL_CACHE_KEY);
    return await getMilkPool(pid);
};

export const deleteMilkPool = async (pid) => {
    await prisma.pool_milk.delete({ where: { pid } });
    await clearCachedData(POOL_CACHE_KEY);
};

export const updateMilkPoolStatus = async (pid, milk_status, remarks, modified_by) => {
    const milkPool = await prisma.pool_milk.findUniqueOrThrow({
        where: { pid },
    });

    if (milkPool.milk_status === milk_status) {
        throw new AppError(`Milk pool ${pid} is already marked as ${milk_status}`, 400);
    }

    if (milk_status !== "discarded" && milkPool.expiration_date < startOfToday()) {
        throw new AppError(
            `Pool ${pid} expiration date has passed. Milk status can no longer be updated from 'expired' status unless 'discarded'`,
            400,
        );
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

export const validatePoolMilkForPasteurizing = async (pid, volume_per_bottle, bottle_count) => {
    const total_volume = bottle_count * volume_per_bottle;
    const pool = await prisma.pool_milk.findUniqueOrThrow({
        select: {
            milk_status: true,
            actual_volume_ml: true,
            remaining_volume_ml: true,
            expiration_date: true,
        },
        where: { pid },
    });

    const remainingVolume = pool.remaining_volume_ml !== null ? Number(pool.remaining_volume_ml) : Number(pool.actual_volume_ml);

    if (total_volume > remainingVolume) {
        throw new AppError(
            `Total volume (${total_volume}ml) exceeds pool's remaining volume of ${remainingVolume}ml.`,
            400,
        );
    }

    if (pool.milk_status === "expired" || pool.expiration_date < startOfToday()) {
        throw new AppError(`Cannot create a batch from pool ${pid}, because it has expired.`, 400);
    }

    if (pool.milk_status === "contaminated") {
        throw new AppError(`Cannot create a batch from pool ${pid}, because it is contaminated.`);
    }

    if (pool.milk_status === "discarded") {
        throw new AppError(`Cannot create a batch from pool ${pid}, because it has been discarded`);
    }

    return pool;
};