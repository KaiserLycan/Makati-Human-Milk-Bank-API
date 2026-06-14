import { prisma } from "../db/db.ts";
import { getCachedData, cacheData, clearCachedData } from "../lib/redis.lib.js";
import { AppError } from "../utils/appError.js";
import { checkPrismaError } from "../utils/prismaErrorChecks.js";
import { omit } from "../config/constants.js";

const clearDonorCachedData = async () => {
    const key = "donors:*";
    await clearCachedData(key);
};

export const getDonors = async ({
    application_status,
    status,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
}) => {
    const key = `donors:list:status:${status || "all"}:application:${application_status || "all"}:page${page}:limit:${limit}:search${search || ""}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
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

    const [total, donors] = await prisma.$transaction([
        prisma.donor.count({ where: filter }),
        prisma.donor.findMany({
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
        data: donors,
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

export const getDonor = async (dtn) => {
    const key = `donors:${dtn}`;
    const cachedData = await getCachedData(key);
    if (cachedData) {
        return cachedData;
    }

    const donor = await prisma.donor.findUnique({
        where: {
            dtn: dtn,
        },
        omit: omit,
    });

    if (!donor) throw new AppError("Donor does not exist", 404);

    await cacheData(key, donor);
    return donor;
};

export const createDonor = async ({ name, email, phone, birth_date, profile, modified_by }) => {
    let donor;
    try {
        donor = await prisma.donor.create({
            data: {
                name: name,
                email: email,
                phone: phone,
                birth_date: birth_date,
                profile: profile,
                modified_by: modified_by,
            },
            omit: omit,
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    await clearDonorCachedData();
    return donor;
};

export const updateDonor = async ({
    dtn,
    name,
    email,
    phone,
    birth_date,
    profile,
    modified_by,
}) => {
    let donor;
    try {
        donor = await prisma.donor.update({
            data: {
                name: name,
                email: email,
                phone: phone,
                birth_date: birth_date,
                profile: profile,
                modified_by: modified_by,
            },
            where: {
                dtn: dtn,
            },
            omit: omit,
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    await clearDonorCachedData();
    return donor;
};

export const updateDonorApplicationStatus = async ({ dtn, application_status, modified_by }) => {
    let donor;
    try {
        donor = await prisma.donor.findUniqueOrThrow({
            select: {
                application_status: true,
            },
            where: { dtn: dtn },
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    if (donor.application_status === application_status)
        throw new AppError(`Application is already ${application_status}`, 400);

    donor = await prisma.donor.update({
        data: {
            application_status: application_status,
            account_status: application_status === "approved" ? "active" : "inactive",
            modified_by: modified_by,
        },
        where: {
            dtn: dtn,
        },
        omit: omit,
    });

    await clearDonorCachedData();
    return donor;
};

export const updateDonorStatus = async ({ dtn, status, modified_by }) => {
    let donor;
    try {
        donor = await prisma.donor.findUniqueOrThrow({
            select: {
                account_status: true,
                application_status: true,
            },
            where: { dtn: dtn },
        });
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }

    if (donor.application_status === "rejected")
        throw new AppError(`Cannot activate a rejected donor`, 400);
    if (donor.account_status === status) throw new AppError(`Donor is already ${status}`, 400);

    donor = await prisma.donor.update({
        data: {
            account_status: status,
            modified_by: modified_by,
        },
        where: {
            dtn: dtn,
        },
        omit: omit,
    });

    await clearDonorCachedData();
    return donor;
};

export const deleteDonor = async ({ dtn, modified_by }) => {
    try {
        await prisma.donor.update({
            data: {
                modified_by: modified_by,
            },
            where: {
                dtn: dtn,
            },
        });

        await prisma.donor.delete({
            where: {
                dtn: dtn,
            },
        });

        await clearDonorCachedData();
    } catch (error) {
        checkPrismaError(error);
        throw error;
    }
};
