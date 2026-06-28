import { prisma } from "../library/db/db.ts";
import { omit } from "../configuration/constants.js";
import { AppError } from "../library/classes/AppError.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";
import {
    deleteImageFromCloudinary,
    uploadBeneficiaryProfileToCloudinary,
} from "./cloudinary.services.js";
import { deepmerge } from "deepmerge-ts";

const BENEFICIARY_CACHE_KEY = "beneficiaries:*";

export const fetchBeneficiaries = async (params) => {
    const { application_status, status, search, page, limit, sortBy, sortOrder } = params;
    const key = `beneficiaries:list:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
        ...(status && { account_status: status }),
        ...(application_status && { application_status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { caregiver_email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [total, beneficiaries] = await prisma.$transaction([
        prisma.beneficiary.count({ where }),
        prisma.beneficiary.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            omit,
        }),
    ]);

    const results = {
        data: beneficiaries,
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

export const fetchBeneficiaryDetails = async (bid) => {
    const key = `beneficiaries:${bid}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const beneficiary = await prisma.beneficiary.findUniqueOrThrow({
        where: { bid },
        omit,
    });

    await cacheData(key, beneficiary);
    return beneficiary;
};

export const createBeneficiary = async (req) => {
    const modified_by = req.user?.user_id;
    let profile;

    try {
        if (req.body.caregiver_email) {
            req.body.caregiver_email = req.body.caregiver_email.toLowerCase();
        }
        profile = await uploadBeneficiaryProfileToCloudinary(req, req.body.profile);
        const beneficiary = await prisma.beneficiary.create({
            data: { ...req.body, profile, modified_by },
            omit,
        });
        await clearCachedData(BENEFICIARY_CACHE_KEY);
        return beneficiary;
    } catch (error) {
        if (profile?.profile_image_url) {
            await deleteImageFromCloudinary(profile.profile_image_url);
        }
        if (profile?.prescription_details) {
            await deleteImageFromCloudinary(profile.prescription_details);
        }
        if (profile?.clinical_abstract) {
            await deleteImageFromCloudinary(profile.clinical_abstract);
        }
        throw error;
    }
};

export const updateBeneficiary = async (req) => {
    const { bid } = req.params;
    const modified_by = req.user.user_id;
    let beneficiaryData;

    try {
        const existingBeneficiary = await fetchBeneficiaryDetails(bid);
        if (req.body.caregiver_email) {
            req.body.caregiver_email = req.body.caregiver_email.toLowerCase();
        }
        const updatedProfile = deepmerge(existingBeneficiary.profile, req.body.profile);
        beneficiaryData = { ...req.body, profile: updatedProfile, modified_by };

        beneficiaryData.profile = await uploadBeneficiaryProfileToCloudinary(
            req,
            beneficiaryData.profile,
            existingBeneficiary.profile,
        );

        const beneficiary = await prisma.beneficiary.update({
            where: { bid },
            data: beneficiaryData,
            omit,
        });
        await clearCachedData(BENEFICIARY_CACHE_KEY);
        return beneficiary;
    } catch (error) {
        if (beneficiaryData?.profile?.profile_image_url) {
            await deleteImageFromCloudinary(beneficiaryData.profile.profile_image_url);
        }
        if (beneficiaryData?.profile?.prescription_details) {
            await deleteImageFromCloudinary(beneficiaryData.profile.prescription_details);
        }
        if (beneficiaryData?.profile?.clinical_abstract) {
            await deleteImageFromCloudinary(beneficiaryData.profile.clinical_abstract);
        }
        throw error;
    }
};

export const updateBeneficiaryApplicationStatus = async ({
    bid,
    application_status,
    modified_by,
}) => {
    const beneficiary = await prisma.beneficiary.findUniqueOrThrow({
        where: { bid },
        select: { application_status: true },
    });

    if (beneficiary.application_status === application_status) {
        throw new AppError(`Application is already ${application_status}`, 400);
    }

    const updatedBeneficiary = await prisma.beneficiary.update({
        where: { bid },
        data: {
            application_status,
            account_status: application_status === "approved" ? "active" : "inactive",
            modified_by,
        },
        omit,
    });

    await clearCachedData(BENEFICIARY_CACHE_KEY);
    return updatedBeneficiary;
};

export const toggleBeneficiaryStatus = async (bid, modified_by) => {
    const beneficiary = await prisma.beneficiary.findUniqueOrThrow({
        where: { bid },
        select: { account_status: true, application_status: true },
    });

    if (beneficiary.application_status === "rejected") {
        throw new AppError("Cannot activate a rejected beneficiary's account", 400);
    }

    const newStatus = beneficiary.account_status === "active" ? "inactive" : "active";

    const updatedBeneficiary = await prisma.beneficiary.update({
        where: { bid },
        data: {
            account_status: newStatus,
            modified_by,
        },
        omit,
    });

    await clearCachedData(BENEFICIARY_CACHE_KEY);
    return updatedBeneficiary;
};

export const deleteBeneficiary = async (bid) => {
    await prisma.beneficiary.delete({
        where: { bid },
    });
    await clearCachedData(BENEFICIARY_CACHE_KEY);
};
