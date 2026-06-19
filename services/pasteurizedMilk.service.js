import { prisma } from "../library/db/db.ts";
import { buildStaffNotifications, notifyStaff } from "./notification.services.js";
import { startOfToday } from "date-fns";
import { AppError } from "../library/classes/AppError.js";
import { omit } from "../configuration/constants.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";

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
    const { milk_status, qat_status, dispense_status, page, limit, sortBy, sortOrder } = params;
    const key = `pasteurized:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = { milk_status, qat_status, dispense_status };

    const [total, records] = await prisma.$transaction([
        prisma.pasteurized_milk.count({ where }),
        prisma.pasteurized_milk.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            omit,
        }),
    ]);

    const responseData = {
        data: records,
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

export const getPasteurizedMilk = async (btl_id) => {
    const key = `pasteurized:${btl_id}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const record = await prisma.pasteurized_milk.findUniqueOrThrow({
        where: { btl_id },
        omit,
    });

    await cacheData(key, record);
    return record;
};

export const createPasteurizedMilk = async (data) => {
    const {
        pid,
        batch_number,
        bottle_count,
        volume_per_bottle,
        bottle_type,
        pasteurization_date,
        processed_by,
        modified_by,
    } = data;

    const pool = await prisma.pool_milk.findUniqueOrThrow({ where: { pid } });
    const total_volume = bottle_count * volume_per_bottle;

    if (total_volume > pool.actual_volume_ml) {
        throw new AppError(
            `Total volume (${total_volume}ml) exceeds pool's actual volume (${pool.actual_volume_ml}ml).`,
            400,
        );
    }

    const bottlesToCreate = Array.from({ length: bottle_count }, (_, i) => ({
        pid,
        batch_number,
        bottle_sequence_number: i + 1,
        volume_ml: volume_per_bottle,
        bottle: bottle_type || "ameda",
        processed_date: new Date(pasteurization_date),
        expiration_date: pool.expiration_date,
        processed_by,
        modified_by,
    }));

    const result = await prisma.pasteurized_milk.createMany({
        data: bottlesToCreate,
    });

    await clearCachedData(PASTEURIZED_CACHE_KEY);
    return result;
};

export const updatePasteurizedMilk = async (btl_id, data) => {
    const updatedRecord = await prisma.pasteurized_milk.update({
        where: { btl_id },
        data,
        omit,
    });
    await clearCachedData(PASTEURIZED_CACHE_KEY);
    return updatedRecord;
};

export const deletePasteurizedMilk = async (btl_id) => {
    await prisma.pasteurized_milk.delete({ where: { btl_id } });
    await clearCachedData(PASTEURIZED_CACHE_KEY);
};

export const updateQATStatus = async (btl_id, qat_status, modified_by) => {
    const record = await prisma.pasteurized_milk.findUniqueOrThrow({
        where: { btl_id },
        select: { qat_status: true },
    });

    if (record.qat_status === qat_status) {
        throw new AppError(`Record ${btl_id} is already ${qat_status}`, 400);
    }

    return prisma.pasteurized_milk.update({
        where: { btl_id },
        data: { qat_status, modified_by },
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

    return prisma.pasteurized_milk.update({
        where: { btl_id },
        data: { milk_status, remarks, modified_by },
        omit,
    });
};
