import { requestQuery, retrieveRequestInformation } from "../services/request.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const getRequestById = async (req, res) => {
    const { rid } = req.params;
    const request = await retrieveRequestInformation({ rid });
    return res
        .status(200)
        .json(new APIResponse(200, request, "Retrieved request information  successful"));
};

export const getRequests = async (req, res) => {
    const requests = await requestQuery(req.query);
    return res.status(200).json(new APIResponse(200, requests, "Query successful"));
};

export const createRequest = async (req, res) => {
    try {
        const { bid, requested_vol_ml, hospital } = req.body;
        const user_id = req.user.user_id;

        if (!bid) return res.status(400).json({ error: "Beneficiary ID is required." });
        if (requested_vol_ml === undefined || requested_vol_ml === null)
            return res.status(400).json({ error: "Requested volume is required." });
        if (requested_vol_ml <= 0)
            return res.status(400).json({ error: "Requested volume must be greater than 0." });

        // Verify beneficiary exists and is approved
        const beneficiary = await prisma.beneficiary.findUniqueOrThrow({
            where: { bid: parseInt(bid) },
        });

        if (beneficiary.application_status !== "approved") {
            return res.status(400).json({ error: "Beneficiary application is not approved." });
        }

        const newRequest = await prisma.request.create({
            data: {
                bid: parseInt(bid),
                requested_vol_ml,
                hospital: hospital || null,
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
            },
        });

        return res.status(201).json(newRequest);
    } catch (error) {
        if (error.code === "P2025")
            return res.status(404).json({ error: "Beneficiary not found." });
        console.log("Error in CreateRequest Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const cancelRequest = async (req, res) => {
    try {
        const { rid } = req.params;
        const user_id = req.user.user_id;

        const request = await prisma.request.findUniqueOrThrow({
            where: { rid: parseInt(rid) },
        });

        if (request.request_status === "completed") {
            return res.status(400).json({ error: "Cannot cancel a completed request." });
        }

        if (request.request_status === "canceled") {
            return res.status(400).json({ error: "Request is already canceled." });
        }

        const updatedRequest = await prisma.request.update({
            where: { rid: parseInt(rid) },
            data: {
                request_status: "canceled",
                modified_by: user_id,
            },
        });

        return res.status(200).json(updatedRequest);
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "Request not found." });
        console.log("Error in CancelRequest Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
