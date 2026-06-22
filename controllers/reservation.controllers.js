import {
    createRequest as createRequestService,
    cancelRequestService,
    requestQuery,
    retrieveRequestInformation,
} from "../services/request.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const getRequestById = async (req, res) => {
    const { rid } = req.params;
    const request = await retrieveRequestInformation({ rid: parseInt(rid) });
    return res
        .status(200)
        .json(new APIResponse(200, request, "Retrieved request information successful"));
};

export const getRequests = async (req, res) => {
    const requests = await requestQuery(req.query);
    return res.status(200).json(new APIResponse(200, requests, "Query successful"));
};

export const createRequest = async (req, res) => {
    const { bid, requested_vol_ml, hospital } = req.body;
    const modified_by = req.user.user_id;

    const newRequest = await createRequestService({
        bid,
        requested_vol_ml,
        hospital,
        modified_by,
    });
    return res.status(201).json(new APIResponse(201, newRequest, "Request created successfully"));
};

export const cancelRequest = async (req, res) => {
    const { rid } = req.params;
    const modified_by = req.user.user_id;

    const updatedRequest = await cancelRequestService({
        rid: parseInt(rid),
        modified_by,
    });
    return res.status(200).json(new APIResponse(200, updatedRequest, "Request canceled successfully"));
};
