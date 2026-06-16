import { cacheData, clearCachedData, getCachedData } from "../../../config/redis.lib.js";
import { prisma } from "../../../lib/db/db.ts";
import { omit } from "../../../config/constants.js";
import { AppError } from "../../../lib/error/appError.js";
import { checkPrismaError } from "../../../lib/utils/prismaErrorChecks.js";

const clearBeneficiaryCachedData = async () => {
    const key = "beneficiaries:*";
    await clearCachedData(key);
};
export const getBeneficiaries = async ({
    application_status,
    status,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
}) => {
    const key = `beneficiaries:list:status:${status || "all"}:application:${application_status || "all"}:page${page}:limit:${limit}:search${search || ""}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
    const cachedData = await getCachedData(key);
    if (cachedData) {
        return cachedData;
    }

    const filter = {
        ...(status && { status }),
        ...(application_status && { application_status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [total, beneficiaries] = await prisma.$transaction([
        prisma.beneficiary.count({ where: filter }),
        prisma.beneficiary.findMany({
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
        data: beneficiaries,
        meta: {
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
        },
    };

    await cacheData(key, responseData);
    return responseData;
};

export const getBeneficiary = async (bid) => {
    const key = `beneficiaries:${bid}`;
    const cachedData = await getCachedData(key);
    if (cachedData) {
        return cachedData;
    }

    const beneficiary = await prisma.beneficiary.findUnique({
        where: {
            bid: bid,
        },
        omit: omit,
    });

    if (!beneficiary) throw new AppError("beneficiary does not exist", 404);

    await cacheData(key, beneficiary);
    return beneficiary;
};

export const createBeneficiary = async ({
    name,
    caregiver,
    caregiver_email,
    caregiver_phone,
    birth_date,
    weight_kg,
    feeding_requirement_ml,
    profile,
    modified_by,
}) => {
    let beneficiary;

    try {
        beneficiary = await prisma.beneficiary.create({
            data: {
                name: name,
                caregiver: caregiver,
                caregiver_email: caregiver_email,
                caregiver_phone: caregiver_phone,
                birth_date: birth_date,
                weight_kg: weight_kg,
                feeding_requirement_ml: feeding_requirement_ml,
                profile: profile,
                modified_by: modified_by,
            },
            omit: omit,
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    await clearBeneficiaryCachedData();
    return beneficiary;
};

export const updateBeneficiary = async ({
    bid,
    name,
    caregiver,
    caregiver_email,
    caregiver_phone,
    birth_date,
    weight_kg,
    feeding_requirement_ml,
    profile,
    modified_by,
}) => {
    let beneficiary;

    try {
        beneficiary = await prisma.beneficiary.update({
            data: {
                name: name,
                caregiver: caregiver,
                caregiver_email: caregiver_email,
                caregiver_phone: caregiver_phone,
                birth_date: birth_date,
                weight_kg: weight_kg,
                feeding_requirement_ml: feeding_requirement_ml,
                profile: profile,
                modified_by: modified_by,
            },
            where: {
                bid: bid,
            },
            omit: omit,
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    await clearBeneficiaryCachedData();
    return beneficiary;
};

export const updateBeneficiaryApplicationStatus = async ({
    bid,
    application_status,
    modified_by,
}) => {
    let beneficiary;
    try {
        beneficiary = await prisma.beneficiary.findUniqueOrThrow({
            select: {
                application_status: true,
            },
            where: { bid: bid },
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    if (beneficiary.application_status === application_status)
        throw new AppError(`Application is already ${application_status}`, 400);

    beneficiary = await prisma.beneficiary.update({
        data: {
            application_status: application_status,
            account_status: application_status === "approved" ? "active" : "inactive",
            modified_by: modified_by,
        },
        where: {
            bid: bid,
        },
        omit: omit,
    });

    await clearBeneficiaryCachedData();
    return beneficiary;
};

export const updateBeneficiaryStatus = async ({ bid, status, modified_by }) => {
    let beneficiary;
    try {
        beneficiary = await prisma.beneficiary.findUniqueOrThrow({
            select: {
                account_status: true,
                application_status: true,
            },
            where: { bid: bid },
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    if (beneficiary.application_status === "rejected")
        throw new AppError(`Cannot activate a rejected beneficiary`, 400);
    if (beneficiary.account_status === status)
        throw new AppError(`Beneficiary is already ${status}`, 400);

    beneficiary = await prisma.beneficiary.update({
        data: {
            account_status: status,
            modified_by: modified_by,
        },
        where: {
            bid: bid,
        },
        omit: omit,
    });

    await clearBeneficiaryCachedData();
    return beneficiary;
};

export const deleteBeneficiary = async ({ bid, modified_by }) => {
    try {
        await prisma.beneficiary.update({
            data: {
                modified_by: modified_by,
            },
            where: {
                bid: bid,
            },
        });

        await prisma.beneficiary.delete({
            where: {
                bid: bid,
            },
        });

        await clearBeneficiaryCachedData();
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }
};
