import { prisma } from "../library/db/db.ts";
import { AppError } from "../library/classes/AppError.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";
import {
    deleteImageFromCloudinary,
    uploadDonorProfileToCloudinary,
} from "./cloudinary.services.js";
import { deepmerge } from "deepmerge-ts";

const DONOR_CACHE_KEY = "donors:*";

const donorOmit = {
    modified_at: true,
    modified_by: true,
};

export const fetchDonors = async (params) => {
    const { application_status, status, search, page, limit, sortBy, sortOrder } = params;
    const key = `donors:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
        ...(status && { account_status: status }),
        ...(application_status && { application_status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                ...(!isNaN(Number(search)) ? [{ dtn: { equals: Number(search) } }] : []),
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
            include: {
                raw_milk: {
                    select: {
                        collection_date: true,
                    },
                    orderBy: {
                        collection_date: "desc",
                    },
                    take: 1,
                },
            },
            omit: donorOmit,
        }),
    ]);

    const mappedDonors = donors.map((d) => {
        const lastRawMilk = d.raw_milk?.[0];
        const lastDonationDate = lastRawMilk ? lastRawMilk.collection_date : null;
        const { raw_milk, ...rest } = d;
        return {
            ...rest,
            last_system_donation: lastDonationDate,
        };
    });

    const results = {
        data: mappedDonors,
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
        include: {
            raw_milk: {
                select: {
                    collection_date: true,
                },
                orderBy: {
                    collection_date: "desc",
                },
                take: 1,
            },
        },
        omit: donorOmit,
    });

    const lastRawMilk = donor.raw_milk?.[0];
    const lastDonationDate = lastRawMilk ? lastRawMilk.collection_date : null;
    const { raw_milk, ...rest } = donor;

    const result = {
        ...rest,
        last_system_donation: lastDonationDate,
    };

    await cacheData(key, result);
    return result;
};

export const registerDonor = async (req) => {
    const { name, email, phone, birth_date, profile } = req.body;
    const modified_by = req.user?.user_id;

    // Check for duplicate email
    const existingDonor = await prisma.donor.findUnique({
        where: { email },
    });
    if (existingDonor) {
        throw new AppError("Email is already in use by another donor.", 400);
    }

    let updatedProfile;

    try {
        updatedProfile = await uploadDonorProfileToCloudinary(req, profile);

        const donor = await prisma.donor.create({
            data: {
                name,
                email,
                phone,
                birth_date,
                profile: updatedProfile,
                modified_by,
            },
            omit: donorOmit,
        });

        await clearCachedData(DONOR_CACHE_KEY);
        return donor;
    } catch (error) {
        if (updatedProfile?.personal_information?.profile_image_url) {
            await deleteImageFromCloudinary(updatedProfile.personal_information.profile_image_url);
        }
        throw error;
    }
};
export const updateDonor = async (req) => {
    const { dtn } = req.params;
    const modified_by = req.user?.user_id;
    let donorData;

    try {
        const existingDonor = await fetchDonorDetails(dtn);

        if (req.body.email && req.body.email !== existingDonor.email) {
            const anotherDonorWithSameEmail = await prisma.donor.findFirst({
                where: {
                    email: req.body.email,
                    dtn: { not: dtn },
                },
            });

            if (anotherDonorWithSameEmail) {
                throw new AppError("Email is already in use by another donor.", 400);
            }
        }

        const updatedProfile = deepmerge(existingDonor.profile, req.body.profile);
        donorData = { ...req.body, profile: updatedProfile, modified_by };

        donorData.profile = await uploadDonorProfileToCloudinary(
            req,
            donorData.profile,
            existingDonor.profile,
        );

        const updatedDonor = await prisma.donor.update({
            where: { dtn },
            data: donorData,
            omit: donorOmit,
        });

        await clearCachedData(DONOR_CACHE_KEY);
        return updatedDonor;
    } catch (error) {
        if (donorData?.profile?.personal_information?.profile_image_url) {
            await deleteImageFromCloudinary(
                donorData.profile.personal_information.profile_image_url,
            );
        }
        throw error;
    }
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
        omit: donorOmit,
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
        omit: donorOmit,
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
