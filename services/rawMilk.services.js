import { prisma } from "../library/db/db.ts";
import { omit } from "../configuration/constants.js";
import { AppError } from "../library/classes/AppError.js";
import { clearCachedData, fetchCachedData, cacheData } from "./redis.services.js";
import { startOfToday } from "date-fns";
import { buildStaffNotifications, notifyStaff } from "./notification.services.js";
import { fetchDonorDetails } from "./donor.services.js";

const RAW_MILK_CACHE_KEY = "rawMilk:*";

export const markExpiredRawMilk = async () => {
    const expiredMilk = await prisma.raw_milk.findMany({
        where: { expiration_date: { lt: startOfToday() }, milk_status: "good" },
        select: { ctn: true },
    });

    if (expiredMilk.length > 0) {
        const ids = expiredMilk.map((milk) => milk.ctn);
        await prisma.raw_milk.updateMany({
            where: { ctn: { in: ids } },
            data: {
                milk_status: "expired",
                qat_status: "fail",
            },
        });

        await notifyStaff(
            await buildStaffNotifications(
                "Raw Milk",
                ids,
                (id) => `Raw milk (CTN: ${id}) has expired`,
            ),
        );
    }
};

const checkDailyLimit = async (dtn, program, volume_ml, limit) => {
    const startOfDay = startOfToday();
    const dailyRawMilk = await prisma.raw_milk.aggregate({
        _sum: { volume_ml: true },
        where: {
            dtn,
            program,
            collection_date: { gte: startOfDay },
        },
    });

    const currentTotal = dailyRawMilk._sum.volume_ml || 0;
    if (currentTotal + volume_ml > limit) {
        throw new AppError(
            `Collection exceeds daily limit of ${limit}ml. Current total today is ${currentTotal}ml.`,
            400,
        );
    }
};

export const getRawMilk = async (params) => {
    const { milk_status, qat_status, program, page, limit, sortBy, sortOrder, dtn } = params;
    const key = `rawMilk:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = { milk_status, qat_status, program, dtn };

    const [total, rawMilks] = await prisma.$transaction([
        prisma.raw_milk.count({ where }),
        prisma.raw_milk.findMany({
            select: {
                ctn: true,
                donor: {
                    select: {
                        dtn: true,
                        name: true,
                    },
                },
                program: true,
                hospital: true,
                health_center: true,
                volume_ml: true,
                collected_by_user: {
                    select: {
                        user_id: true,
                        name: true,
                    },
                },
                collection_date: true,
                expiration_date: true,
                pickup_date: true,
                qat_status: true,
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
        data: rawMilks,
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

export const getRawMilkById = async (ctn) => {
    const key = `rawMilk:${ctn}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const collection = await prisma.raw_milk.findUniqueOrThrow({
        select: {
            ctn: true,
            donor: {
                select: {
                    dtn: true,
                    name: true,
                },
            },
            program: true,
            hospital: true,
            health_center: true,
            volume_ml: true,
            collected_by_user: {
                select: {
                    user_id: true,
                    name: true,
                },
            },
            collection_date: true,
            expiration_date: true,
            pickup_date: true,
            qat_status: true,
            milk_status: true,
            remarks: true,
        },
        where: { ctn },
    });

    await cacheData(key, collection);
    return collection;
};

export const createCollection = async (data) => {
    const { dtn, program, volume_ml, limit, ...restData } = data;
    if (limit) await checkDailyLimit(dtn, program, volume_ml, limit);

    const donor = await fetchDonorDetails(dtn);

    if (donor.application_status === "rejected") {
        throw new AppError("Donor cannot donate milk. Their application is rejected.", 400);
    }

    const collection = await prisma.raw_milk.create({
        select: {
            ctn: true,
        },
        data: { dtn, program, volume_ml, ...restData },
    });

    await markExpiredRawMilk();
    await clearCachedData(RAW_MILK_CACHE_KEY);
    return await getRawMilkById(collection.ctn);
};

export const updateCollection = async (ctn, data) => {
    const { dtn, program, volume_ml, limit, ...restData } = data;
    if (limit) await checkDailyLimit(dtn, program, volume_ml, limit);

    await prisma.raw_milk.update({
        where: { ctn },
        data: { dtn, program, volume_ml, ...restData },
        omit,
    });

    await markExpiredRawMilk();
    await clearCachedData(RAW_MILK_CACHE_KEY);
    return await getRawMilkById(ctn);
};

export const deleteCollection = async (ctn) => {
    await prisma.raw_milk.delete({ where: { ctn } });
    await clearCachedData(RAW_MILK_CACHE_KEY);
};

export const updateMilkStatus = async (ctn, milk_status, modified_by) => {
    const collection = await prisma.raw_milk.findUniqueOrThrow({ where: { ctn } });

    if (collection.milk_status === milk_status)
        throw new AppError(`Collection ${ctn} milk_status is already ${milk_status}`, 400);

    if (milk_status !== "discarded" && collection.expiration_date < startOfToday()) {
        throw new AppError(
            `Collection ${ctn} expiration date has passed. Milk status can no longer be updated from 'expired' status unless 'discarded'`,
            400,
        );
    }

    await prisma.raw_milk.update({
        where: { ctn },
        data: { milk_status, modified_by },
    });

    await clearCachedData(RAW_MILK_CACHE_KEY);
    return getRawMilkById(ctn);
};

export const updateQATStatus = async (ctn, qat_status, modified_by) => {
    const collection = await prisma.raw_milk.findUniqueOrThrow({ where: { ctn } });

    if (collection.qat_status === qat_status)
        throw new AppError(`Collection ${ctn} qat_status is already set to ${qat_status}`, 400);

    if (collection.milk_status === "expired" || collection.milk_status === "contaminated") {
        throw new AppError(
            `Cannot update ${ctn} qat_status from 'fail' because it is ${collection.milk_status}.`,
            400,
        );
    }

    await prisma.raw_milk.update({
        where: { ctn },
        data: { qat_status, modified_by },
    });

    await clearCachedData(RAW_MILK_CACHE_KEY);
    return getRawMilkById(ctn);
};

export const validateCollectionsForPooling = async (collectionIds) => {
    const rawMilk = await prisma.raw_milk.findMany({
        where: { ctn: { in: collectionIds } },
    });

    rawMilk.forEach((milk) => {
        if (milk.expiration_date < startOfToday() || milk.milk_status === "expired") {
            throw new AppError(`Cannot pool collection ${milk.ctn} because it is expired.`, 400);
        }

        if (milk.milk_status === "discarded") {
            throw new AppError(
                `Cannot pool collection ${milk.ctn} because it has been discarded`,
                400,
            );
        }

        if (milk.qat_status !== "pass" || milk.milk_status === "contaminated") {
            throw new AppError(`Cannot pool collection ${milk.ctn} because hasn't passed QAT`, 400);
        }

        if (milk.pid !== null) {
            throw new AppError(
                `Cannot pool collection ${milk.ctn} because it is already part of pool ${milk.pid}.`,
                400,
            );
        }
    });

    return rawMilk;
};

export const getTotalVolume = (rawMilk) => {
    return rawMilk.reduce((total, milk) => total + milk.volume_ml, 0);
};
