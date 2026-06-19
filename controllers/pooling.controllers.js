import {
    createMilkPool as createMilkPoolService,
    deleteMilkPool as deleteMilkPoolService,
    getMilkPools,
    getMilkPool,
    updateMilkPool as updateMilkPoolService,
    updateQATStatus as updateQATStatusService,
    updateMilkPoolStatus as updateMilkPoolStatusService,
} from "../services/poolMilk.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const queryMilkPools = async (req, res) => {
    const pools = await getMilkPools(req.query);
    return res.status(200).json(new APIResponse(200, pools, "Query Successful"));
};

export const viewMilkPool = async (req, res) => {
    const { pid } = req.params;
    const pool = await getMilkPool(parseInt(pid));
    return res.status(200).json(new APIResponse(200, pool, "Successfully retrieved milk pool."));
};

export const createMilkPool = async (req, res) => {
    const modified_by = req.user.user_id;
    const newPool = await createMilkPoolService({
        ...req.body,
        pooled_by: modified_by,
        modified_by,
    });
    return res.status(201).json(new APIResponse(201, newPool, "Milk pool created successfully"));
};

export const updateMilkPool = async (req, res) => {
    const { pid } = req.params;
    const modified_by = req.user.user_id;

    const updatedPool = await updateMilkPoolService(parseInt(pid), {
        ...req.body,
        modified_by,
    });

    return res
        .status(200)
        .json(new APIResponse(200, updatedPool, "Milk pool updated successfully"));
};

export const deleteMilkPool = async (req, res) => {
    const { pid } = req.params;
    await deleteMilkPoolService(parseInt(pid));
    return res.status(200).json(new APIResponse(200, null, "Successfully deleted milk pool"));
};

export const updateQATStatus = async (req, res) => {
    const { pid } = req.params;
    const { qat_status } = req.body;
    const modified_by = req.user.user_id;
    const updatedPool = await updateQATStatusService(parseInt(pid), qat_status, modified_by);
    return res
        .status(200)
        .json(new APIResponse(200, updatedPool, "QAT status updated successfully"));
};

export const updateMilkPoolStatus = async (req, res) => {
    const { pid } = req.params;
    const { milk_status, remarks } = req.body;
    const modified_by = req.user.user_id;
    const updatedPool = await updateMilkPoolStatusService(
        parseInt(pid),
        milk_status,
        remarks,
        modified_by,
    );
    return res
        .status(200)
        .json(new APIResponse(200, updatedPool, "Milk pool status updated successfully"));
};
