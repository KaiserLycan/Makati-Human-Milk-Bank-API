import { prisma } from "../library/db/db.ts";
import { buildStaffNotifications, notifyStaff } from "./notification.services.js";
import { startOfToday, addMonths } from "date-fns";
import { AppError } from "../library/classes/AppError.js";
import { omit } from "../configuration/constants.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";
import { validatePoolMilkForPasteurizing } from "./poolMilk.services.js";

const PASTEURIZED_CACHE_KEY = "pasteurized:*";

export const markExpiredPasteurizedMilk = async () => {
    const expiredMilk = await prisma.pasteurized_milk.findMany({
        where: { expiration_date: { lt: startOfToday() }, milk_status: "good" },
        select: { btl_id: true },
    });

    if (expiredMilk.length > 0) {
        const ids = expiredMilk.map((milk) => milk.btl_id);
        await prisma.pasteurized_milk.updateMany({
            where: { btl_id: { in: ids } },
            data: { milk_status: "expired", dispense_status: "dispensed" },
        });

        await notifyStaff(
            buildStaffNotifications(
                "Pasteurized Milk",
                ids,
                (id) => `Pasteurized milk (BTL_ID: ${id}) has expired`,
            ),
        );
    }
};

export const getPasteurizedMilkRecords = async (params) => {
    const { search, milk_status, mbt_status, dispense_status, page, limit, sortBy, sortOrder } =
        params;
    const key = `pasteurized:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {};
    if (milk_status) where.milk_status = milk_status;
    if (mbt_status) where.mbt_status = mbt_status;
    if (dispense_status) where.dispense_status = dispense_status;
    if (search) {
        const searchNumber = parseInt(search);

        // Only apply the ID search if the user typed a valid number
        if (!isNaN(searchNumber)) {
            where.OR = [{ btl_id: searchNumber }, { batch_number: searchNumber }];
        }
    }

    const [total, records] = await prisma.$transaction([
        prisma.pasteurized_milk.count({ where }),
        prisma.pasteurized_milk.findMany({
            select: {
                btl_id: true,
                batch_milk: {
                    select: {
                        batch_id: true,
                        processed_date: true,
                        user: {
                            select: {
                                user_id: true,
                                name: true,
                            },
                        },
                    },
                },
                bottle_sequence_number: true,
                volume_ml: true,
                bottle: true,
                expiration_date: true,
                mbt_status: true,
                dispense_status: true,
                milk_status: true,
                remarks: true,
            },
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);

    const results = {
        data: records,
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

export const getPasteurizedMilk = async (btl_id) => {
    const key = `pasteurized:${btl_id}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const record = await prisma.pasteurized_milk.findUniqueOrThrow({
        select: {
            btl_id: true,
            batch_milk: {
                select: {
                    batch_id: true,
                    processed_date: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                        },
                    },
                },
            },
            bottle_sequence_number: true,
            volume_ml: true,
            bottle: true,
            expiration_date: true,
            mbt_status: true,
            dispense_status: true,
            milk_status: true,
            remarks: true,
        },
        where: { btl_id },
    });

    await cacheData(key, record);
    return record;
};

export const createBatchMilk = async (data) => {
    const {
        pid,
        bottle_count,
        bottle_type,
        volume_per_bottle,
        pasteurization_date,
        processed_by,
        modified_by,
    } = data;

    const validatedPool = await validatePoolMilkForPasteurizing(
        pid,
        volume_per_bottle,
        bottle_count,
    );

    const totalVolumeToUse = bottle_count * volume_per_bottle;

    const result = await prisma.$transaction(async (tx) => {
        const batchMilk = await tx.batch_milk.create({
            data: {
                processed_date: pasteurization_date,
                processed_by,
                source: pid,
                bottle_count,
            },
        });

        const bottlesToCreate = Array.from({ length: bottle_count }, (_, i) => ({
            batch_number: batchMilk.batch_id,
            bottle_sequence_number: i + 1,
            volume_ml: volume_per_bottle,
            bottle: bottle_type,
            expiration_date: validatedPool.expiration_date,
            modified_by,
        }));

        const createdBottles = await tx.pasteurized_milk.createManyAndReturn({
            select: {
                btl_id: true,
                batch_milk: {
                    select: {
                        batch_id: true,
                        processed_date: true,
                        user: {
                            select: {
                                user_id: true,
                                name: true,
                            },
                        },
                    },
                },
                bottle_sequence_number: true,
                volume_ml: true,
                bottle: true,
                expiration_date: true,
                mbt_status: true,
                dispense_status: true,
                milk_status: true,
                remarks: true,
            },
            data: bottlesToCreate,
        });

        // Update remaining_volume_ml on pool_milk
        const pool = await tx.pool_milk.findUniqueOrThrow({
            where: { pid },
            select: { actual_volume_ml: true, remaining_volume_ml: true },
        });

        const currentRemaining =
            pool.remaining_volume_ml !== null
                ? Number(pool.remaining_volume_ml)
                : Number(pool.actual_volume_ml);
        const newRemaining = currentRemaining - totalVolumeToUse;

        await tx.pool_milk.update({
            where: { pid },
            data: { remaining_volume_ml: newRemaining },
        });

        return createdBottles;
    });

    await clearCachedData(PASTEURIZED_CACHE_KEY);
    await clearCachedData("pools:*");
    return result;
};

export const updatePasteurizedMilk = async (btl_id, data) => {
    const { volume_per_bottle, pasteurization_date, modified_by } = data;

    const bottleToUpdate = await prisma.pasteurized_milk.findUniqueOrThrow({
        where: { btl_id },
        select: {
            batch_number: true,
            volume_ml: true,
            batch_milk: {
                select: {
                    source: true,
                },
            },
        },
    });

    const updateData = { ...data, modified_by };

    return await prisma.$transaction(async (tx) => {
        if (volume_per_bottle) {
            const sourcePoolId = bottleToUpdate.batch_milk.source;
            const sourcePool = await tx.pool_milk.findUniqueOrThrow({
                where: { pid: sourcePoolId },
                select: { actual_volume_ml: true, remaining_volume_ml: true },
            });

            const remainingVolume =
                sourcePool.remaining_volume_ml !== null
                    ? Number(sourcePool.remaining_volume_ml)
                    : Number(sourcePool.actual_volume_ml);

            const difference = Number(volume_per_bottle) - Number(bottleToUpdate.volume_ml);

            if (difference > remainingVolume) {
                throw new AppError(
                    `Updated volume exceeds the source pool's remaining volume of ${remainingVolume}ml.`,
                    400,
                );
            }

            const newRemaining = remainingVolume - difference;
            await tx.pool_milk.update({
                where: { pid: sourcePoolId },
                data: { remaining_volume_ml: newRemaining },
            });

            updateData.volume_ml = volume_per_bottle;
            delete updateData.volume_per_bottle;
        }

        if (pasteurization_date) {
            // Assuming a shelf life of 6 months for refrigerated milk.
            // This should be configured somewhere ideally.
            const newExpirationDate = addMonths(new Date(pasteurization_date), 6);
            updateData.expiration_date = newExpirationDate;

            if (newExpirationDate < new Date()) {
                updateData.milk_status = "expired";
                updateData.dispense_status = "dispensed";
            }
        }

        const updatedRecord = await tx.pasteurized_milk.update({
            where: { btl_id },
            data: updateData,
            omit,
        });

        await clearCachedData(PASTEURIZED_CACHE_KEY);
        await clearCachedData("pools:*");
        return updatedRecord;
    });
};

export const deletePasteurizedMilk = async (btl_id) => {
    await prisma.$transaction(async (tx) => {
        const bottle = await tx.pasteurized_milk.findUniqueOrThrow({
            where: { btl_id },
            select: {
                volume_ml: true,
                batch_milk: {
                    select: {
                        source: true,
                    },
                },
            },
        });

        const sourcePoolId = bottle.batch_milk.source;
        const volumeToReturn = Number(bottle.volume_ml);

        const sourcePool = await tx.pool_milk.findUniqueOrThrow({
            where: { pid: sourcePoolId },
            select: { actual_volume_ml: true, remaining_volume_ml: true },
        });

        const currentRemaining =
            sourcePool.remaining_volume_ml !== null
                ? Number(sourcePool.remaining_volume_ml)
                : Number(sourcePool.actual_volume_ml);

        await tx.pool_milk.update({
            where: { pid: sourcePoolId },
            data: { remaining_volume_ml: currentRemaining + volumeToReturn },
        });

        await tx.pasteurized_milk.delete({ where: { btl_id } });
    });

    await clearCachedData(PASTEURIZED_CACHE_KEY);
    await clearCachedData("pools:*");
};

export const updateMBTStatus = async (btl_id, mbt_status, modified_by) => {
    const record = await prisma.pasteurized_milk.findUniqueOrThrow({
        where: { btl_id },
        select: { mbt_status: true },
    });

    if (record.mbt_status === mbt_status) {
        throw new AppError(`Record ${btl_id} is already ${mbt_status}`, 400);
    }

    await clearCachedData(PASTEURIZED_CACHE_KEY);
    await clearCachedData("pools:*");

    return prisma.pasteurized_milk.update({
        where: { btl_id },
        data: { mbt_status, modified_by },
        omit,
    });
};

export const updateMilkStatus = async (btl_id, milk_status, remarks, modified_by) => {
    const record = await prisma.pasteurized_milk.findUniqueOrThrow({
        where: { btl_id },
        select: { milk_status: true },
    });

    if (record.milk_status === milk_status) {
        throw new AppError(`Record ${btl_id} is already marked as ${milk_status}`, 400);
    }

    await clearCachedData(PASTEURIZED_CACHE_KEY);
    await clearCachedData("pools:*");

    return prisma.pasteurized_milk.update({
        where: { btl_id },
        data: { milk_status, remarks, modified_by },
        omit,
    });
};
