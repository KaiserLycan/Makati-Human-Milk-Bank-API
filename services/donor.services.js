import { prisma } from "../library/db/db.ts";
import { AppError } from "../library/classes/AppError.js";
import { omit } from "../configuration/constants.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";

const DONOR_CACHE_KEY = "donors:*";

export const fetchDonors = async (params) => {
    const { application_status, status, search, page, limit, sortBy, sortOrder } = params;
    const key = `donors:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
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
        prisma.donor.count({ where }),
        prisma.donor.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            omit,
        }),
    ]);

    const results = {
        data: donors,
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

export const fetchDonorDetails = async (dtn) => {
    const key = `donors:${dtn}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const donor = await prisma.donor.findUniqueOrThrow({
        where: { dtn },
        omit,
    });

    await cacheData(key, donor);
    return donor;
};

export const registerDonor = async (data) => {
    const donor = await prisma.donor.create({
        data,
        omit,
    });
    await clearCachedData(DONOR_CACHE_KEY);
    return donor;
};

export const updateDonor = async (dtn, data) => {
    const donor = await prisma.donor.update({
        where: { dtn },
        data,
        omit,
    });
    await clearCachedData(DONOR_CACHE_KEY);
    return donor;
};

export const updateDonorApplicationStatus = async ({ dtn, application_status, modified_by }) => {
    const donor = await prisma.donor.findUniqueOrThrow({
        where: { dtn },
        select: { application_status: true },
    });

    if (donor.application_status === application_status) {
        throw new AppError(`Application is already ${application_status}`, 400);
    }

    const updatedDonor = await prisma.donor.update({
        where: { dtn },
        data: {
            application_status,
            account_status: application_status === "approved" ? "active" : "inactive",
            modified_by,
        },
        omit,
    });

    await clearCachedData(DONOR_CACHE_KEY);
    return updatedDonor;
};

export const updateDonorStatus = async ({ dtn, modified_by }) => {
    const donor = await prisma.donor.findUniqueOrThrow({
        where: { dtn },
        select: { account_status: true, application_status: true },
    });

    const newStatus = donor.account_status === "active" ? "inactive" : "active";

    if (donor.application_status === "rejected" && newStatus === "active") {
        throw new AppError("Cannot activate a rejected donor's account", 400);
    }

    const updatedDonor = await prisma.donor.update({
        where: { dtn },
        data: {
            account_status: newStatus,
            modified_by,
        },
        omit,
    });

    await clearCachedData(DONOR_CACHE_KEY);
    return updatedDonor;
};

export const deleteDonor = async (dtn) => {
    await prisma.donor.delete({
        where: { dtn },
    });
    await clearCachedData(DONOR_CACHE_KEY);
};
