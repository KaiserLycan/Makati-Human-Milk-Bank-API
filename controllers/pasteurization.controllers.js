import {
    createPasteurizedMilk as createPasteurizedMilkService,
    deletePasteurizedMilk as deletePasteurizedMilkService,
    getPasteurizedMilkRecords,
    getPasteurizedMilk,
    updatePasteurizedMilk as updatePasteurizedMilkService,
    updateQATStatus as updateQATStatusService,
    updateMilkStatus as updateMilkStatusService,
} from "../services/pasteurizedMilk.service.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const queryPasteurizedMilkRecords = async (req, res) => {
    const records = await getPasteurizedMilkRecords(req.query);
    return res.status(200).json(new APIResponse(200, records, "Query Successful"));
};

export const viewPasteurizedMilk = async (req, res) => {
    const { btl_id } = req.params;
    const record = await getPasteurizedMilk(parseInt(btl_id));
    return res
        .status(200)
        .json(new APIResponse(200, record, "Successfully retrieved pasteurized milk record."));
};

export const createPasteurizedMilk = async (req, res) => {
    const modified_by = req.user.user_id;
    const newRecord = await createPasteurizedMilkService({
        ...req.body,
        processed_by: modified_by,
        modified_by,
    });
    return res
        .status(201)
        .json(new APIResponse(201, newRecord, "Pasteurized milk record created successfully"));
};

export const updatePasteurizedMilk = async (req, res) => {
    const { btl_id } = req.params;
    const modified_by = req.user.user_id;

    const updatedRecord = await updatePasteurizedMilkService(parseInt(btl_id), {
        ...req.body,
        modified_by,
    });

    return res
        .status(200)
        .json(new APIResponse(200, updatedRecord, "Pasteurized milk record updated successfully"));
};

export const deletePasteurizedMilk = async (req, res) => {
    const { btl_id } = req.params;
    await deletePasteurizedMilkService(parseInt(btl_id));
    return res
        .status(200)
        .json(new APIResponse(200, null, "Successfully deleted pasteurized milk record"));
};

export const updateQATStatus = async (req, res) => {
    const { btl_id } = req.params;
    const { qat_status } = req.body;
    const modified_by = req.user.user_id;
    const updatedRecord = await updateQATStatusService(parseInt(btl_id), qat_status, modified_by);
    return res
        .status(200)
        .json(new APIResponse(200, updatedRecord, "QAT status updated successfully"));
};

export const updateMilkStatus = async (req, res) => {
    const { btl_id } = req.params;
    const { milk_status, remarks } = req.body;
    const modified_by = req.user.user_id;
    const updatedRecord = await updateMilkStatusService(
        parseInt(btl_id),
        milk_status,
        remarks,
        modified_by,
    );
    return res
        .status(200)
        .json(new APIResponse(200, updatedRecord, "Milk status updated successfully"));
};
