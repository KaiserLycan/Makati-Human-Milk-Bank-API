import { prisma } from "../library/db/db.ts";
import { omit } from "../configuration/constants.js";
import { AppError } from "../library/classes/AppError.js";
import { clearCachedData, fetchCachedData, cacheData } from "./redis.services.js";
import { startOfToday } from "date-fns";
import { buildStaffNotifications, notifyStaff } from "./notification.services.js";

const RAW_MILK_CACHE_KEY = "collections:*";

export const markExpiredRawMilk = async () => {
    const expiredMilk = await prisma.raw_milk.findMany({
        where: { expiration_date: { lt: startOfToday() }, milk_status: "good" },
        select: { ctn: true },
    });

    if (expiredMilk.length > 0) {
        const ids = expiredMilk.map((milk) => milk.ctn);
        await prisma.raw_milk.updateMany({
            where: { ctn: { in: ids } },
            data: { milk_status: "expired" },
        });

        await notifyStaff(
            buildStaffNotifications("Raw Milk", ids, (id) => `Raw milk (CTN: ${id}) has expired`),
        );
    }
};

const checkDailyLimit = async (dtn, program, volume_ml, limit) => {
    const startOfDay = startOfToday();
    const dailyCollections = await prisma.raw_milk.aggregate({
        _sum: { volume_ml: true },
        where: {
            dtn,
            program,
            collection_date: { gte: startOfDay },
        },
    });

    const currentTotal = dailyCollections._sum.volume_ml || 0;
    if (currentTotal + volume_ml > limit) {
        throw new AppError(
            `Collection exceeds daily limit of ${limit}ml. Current total today is ${currentTotal}ml.`,
            400,
        );
    }
};

export const getCollections = async (params) => {
    const { milk_status, qat_status, program, page, limit, sortBy, sortOrder } = params;
    const key = `collections:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = { milk_status, qat_status, program };

    const [total, collections] = await prisma.$transaction([
        prisma.raw_milk.count({ where }),
        prisma.raw_milk.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            omit,
        }),
    ]);

    const responseData = {
        data: collections,
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

export const getCollection = async (ctn) => {
    const key = `collections:${ctn}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const collection = await prisma.raw_milk.findUniqueOrThrow({
        where: { ctn },
        omit,
        include: { donor: true },
    });

    await cacheData(key, collection);
    return collection;
};

export const createCollection = async (data) => {
    const { dtn, program, volume_ml, limit, ...restData } = data;
    if (limit) await checkDailyLimit(dtn, program, volume_ml, limit);

    const collection = await prisma.raw_milk.create({
        data: { dtn, program, volume_ml, ...restData },
        omit,
    });

    await clearCachedData(RAW_MILK_CACHE_KEY);
    return collection;
};

export const updateCollection = async (ctn, data) => {
    const updatedCollection = await prisma.raw_milk.update({
        where: { ctn },
        data,
        omit,
    });

    await clearCachedData(RAW_MILK_CACHE_KEY);
    return updatedCollection;
};

export const deleteCollection = async (ctn) => {
    await prisma.raw_milk.delete({ where: { ctn } });
    await clearCachedData(RAW_MILK_CACHE_KEY);
};

export const updateMilkStatus = async (ctn, milk_status, modified_by) => {
    const updatedCollection = await prisma.raw_milk.update({
        where: { ctn },
        data: { milk_status, modified_by },
    });

    await clearCachedData(RAW_MILK_CACHE_KEY);
    return updatedCollection;
};

export const updateQATStatus = async (ctn, qat_status, modified_by) => {
    const updatedCollection = await prisma.raw_milk.update({
        where: { ctn },
        data: { qat_status, modified_by },
    });

    await clearCachedData(RAW_MILK_CACHE_KEY);
    return updatedCollection;
};

export const validateCollectionsForPooling = async (collectionIds) => {
    const collections = await prisma.raw_milk.findMany({
        where: { ctn: { in: collectionIds } },
    });

    collections.forEach((milk) => {
        if (milk.qat_status !== "pass") {
            throw new AppError(
                `Cannot pool collection ${milk.ctn} because its QAT status is ${milk.qat_status}.`,
                400,
            );
        }
        if (milk.pid !== null) {
            throw new AppError(
                `Cannot pool collection ${milk.ctn} because it is already part of pool ${milk.pid}.`,
                400,
            );
        }
        if (milk.milk_status !== "good") {
            throw new AppError(
                `Cannot pool collection ${milk.ctn} because its status is ${milk.milk_status}.`,
                400,
            );
        }
    });

    return collections;
};

export const getTotalVolume = (collections) => {
    return collections.reduce((total, milk) => total + milk.volume_ml, 0);
};
