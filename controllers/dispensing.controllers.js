import { prisma } from "../library/db/db.ts";
import { requestQuery, retrieveRequestInformation } from "../services/request.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const getAllocatedRequests = async (req, res) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    let request_status = "allocated";
    const requests = await requestQuery({ request_status, page, limit, sortBy, sortOrder });
    return res.status(200).json(new APIResponse(200, requests, "Query successful"));
};

export const getAllocatedRequest = async (req, res) => {
    const { rid } = req.params;
    const request = await retrieveRequestInformation({ rid, request_status: "allocated" });
    return res
        .status(200)
        .json(new APIResponse(200, request, "Retrieved allocated request information successful"));
};

export const DispenseMilk = async (req, res) => {
    try {
        const { rid } = req.params;
        const user_id = req.user.user_id;

        const request = await prisma.request.findUniqueOrThrow({
            where: { rid: parseInt(rid) },
            include: {
                request_bottles: {
                    include: {
                        pasteurized_milk: true,
                    },
                },
            },
        });

        if (request.request_status !== "allocated") {
            return res.status(400).json({ error: "Only allocated requests can be dispensed." });
        }

        // Mark all allocated bottles as dispensed
        const bottleIds = request.request_bottles.map((rb) => rb.btl_id);

        await prisma.pasteurized_milk.updateMany({
            where: { btl_id: { in: bottleIds } },
            data: {
                dispense_status: "dispensed",
                modified_by: user_id,
            },
        });

        // Mark request as completed
        const completedRequest = await prisma.request.update({
            where: { rid: parseInt(rid) },
            data: {
                request_status: "completed",
                modified_by: user_id,
            },
            include: {
                beneficiary: {
                    select: {
                        bid: true,
                        name: true,
                        caregiver: true,
                        caregiver_email: true,
                    },
                },
                request_bottles: {
                    include: {
                        pasteurized_milk: {
                            select: {
                                btl_id: true,
                                volume_ml: true,
                                expiration_date: true,
                                dispense_status: true,
                            },
                        },
                    },
                },
            },
        });

        return res.status(200).json(completedRequest);
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "Request not found." });
        console.log("Error in DispenseMilk Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
