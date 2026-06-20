import { prisma } from "../library/db/db.ts";
import { omit } from "../configuration/constants.js";
import { AppError } from "../library/classes/AppError.js";
import { startOfToday } from "date-fns";
import { cacheData, fetchCachedData } from "./redis.services.js";

const REQUEST_CACHE_KEY_ALL = "requests:*";
const REQUEST_CACHE_KEY = "requests:";

export const processRequestWithExpiredMilk = async () => {
    const today = startOfToday();

    const affectedRequests = await prisma.request.findMany({
        where: {
            request_status: "allocated",
            request_bottles: {
                some: {
                    pasteurized_milk: {
                        expiration_date: { lt: today },
                        milk_status: "good",
                    },
                },
            },
        },
        include: {
            request_bottles: {
                include: { pasteurized_milk: true },
            },
            beneficiary: true,
        },
    });

    if (affectedRequests.length > 0) {
        const requestIds = affectedRequests.map((req) => req.rid);
        const goodBottleIds = [];

        affectedRequests.forEach((req) => {
            req.request_bottles.forEach((rb) => {
                if (rb.pasteurized_milk.expiration_date >= today) {
                    goodBottleIds.push(rb.btl_id);
                }
            });
        });

        if (goodBottleIds.length > 0) {
            await prisma.pasteurized_milk.updateMany({
                where: { btl_id: { in: goodBottleIds } },
                data: { dispense_status: "available" },
            });
        }

        await prisma.request.updateMany({
            where: { rid: { in: requestIds } },
            data: { request_status: "waiting" },
        });

        await prisma.request_bottles.deleteMany({
            where: { rid: { in: requestIds } },
        });

        const emailPromises = affectedRequests.map((req) => {
            console.log(
                `[EMAIL ALERT] Sending reallocation status to ${req.beneficiary.caregiver_email} for Request ID: ${req.rid}`,
            );
            return sendStatusUpdateEmail(req.beneficiary);
        });

        await Promise.allSettled(emailPromises);
    }
};

export const requestQuery = async (params) => {
    const { request_status, page, limit, sortBy, sortOrder } = params;
    const key = REQUEST_CACHE_KEY + JSON.stringify(params);
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = { request_status };

    const [total, requests] = await prisma.$transaction([
        prisma.request.count({ where }),
        prisma.request.findMany({
            select: {
                rid: true,
                beneficiary: {
                    select: {
                        bid: true,
                        name: true,
                        caregiver: true,
                        caregiver_email: true,
                        caregiver_phone: true,
                    },
                },
                hospital: true,
                requested_vol_ml: true,
                requested_date: true,
                request_status: true,
                request_bottles: {
                    select: {
                        pasteurized_milk: {
                            select: {
                                btl_id: true,
                                volume_ml: true,
                                expiration_date: true,
                                milk_status: true,
                                dispense_status: true,
                                mbt_status: true,
                            },
                        },
                    },
                },
            },
            where,
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);

    const results = {
        data: requests,
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

export const retrieveRequestInformation = async ({ rid, request_status }) => {
    const key = REQUEST_CACHE_KEY + rid;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const where = {
        rid,
        ...(request_status && { request_status }),
    };

    const request = await prisma.request.findUniqueOrThrow({
        select: {
            rid: true,
            beneficiary: {
                select: {
                    bid: true,
                    name: true,
                    caregiver: true,
                    caregiver_email: true,
                    caregiver_phone: true,
                },
            },
            hospital: true,
            requested_vol_ml: true,
            requested_date: true,
            request_status: true,
            request_bottles: {
                select: {
                    pasteurized_milk: {
                        select: {
                            btl_id: true,
                            volume_ml: true,
                            expiration_date: true,
                            milk_status: true,
                            dispense_status: true,
                            mbt_status: true,
                        },
                    },
                },
            },
        },
        where,
    });

    await cacheData(key, request);
    return request;
};

export const createRequest = async ({ bid, requested_vol_ml, hospital, modified_by }) => {
    await verifyBeneficiaryStatus({
        bid,
        account_status: "active",
        application_status: "approved",
    });

    const data = {
        bid: bid,
        requested_vol_ml: requested_vol_ml,
        ...(hospital && { hospital }),
        modified_by: modified_by,
    };

    return prisma.request.create({
        data: data,
        include: {
            beneficiary: true,
        },
        omit: omit,
    });
};

export const updateRequestStatus = async ({ rid, request_status, modified_by }) => {
    const request = await retrieveRequestInformation({ rid });

    if (request?.request_status === request_status)
        throw new AppError(`Request is already ${request_status}`, 400);

    return prisma.request.update({
        where: { rid: rid },
        data: {
            request_status: request_status,
            modified_by: modified_by,
        },
    });
};
