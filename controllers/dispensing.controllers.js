import {
    requestQuery,
    retrieveRequestInformation,
    dispenseMilkService,
} from "../services/request.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const getAllocatedRequests = async (req, res) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    let request_status = "allocated";
    const requests = await requestQuery({ request_status, page, limit, sortBy, sortOrder });
    return res.status(200).json(new APIResponse(200, requests, "Query successful"));
};

export const getAllocatedRequest = async (req, res) => {
    const { rid } = req.params;
    const request = await retrieveRequestInformation({ rid: parseInt(rid), request_status: "allocated" });
    return res
        .status(200)
        .json(new APIResponse(200, request, "Retrieved allocated request information successful"));
};

export const DispenseMilk = async (req, res) => {
    const { rid } = req.params;
    const modified_by = req.user.user_id;

    const completedRequest = await dispenseMilkService({
        rid: parseInt(rid),
        modified_by,
    });
    return res.status(200).json(new APIResponse(200, completedRequest, "Milk dispensed successfully"));
};
