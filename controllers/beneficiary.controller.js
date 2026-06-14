import { SendApproval, SendRejection } from "../service/email.service.js";
import { NotifyStaffNewApplication } from "../service/notification.service.js";
import { APIResponse } from "../utils/apiResponse.js";
import {
    createBeneficiary,
    deleteBeneficiary,
    getBeneficiaries,
    getBeneficiary,
    updateBeneficiary,
    updateBeneficiaryApplicationStatus,
    updateBeneficiaryStatus,
} from "../utils/beneficiary.service.js";
import { uploadBeneficiaryProfileToCloudinary } from "../service/upload.service.js";
export const queryBeneficiaries = async (req, res) => {
    const { application_status, status, page, limit, search, sortBy, sortOrder } = req.query;
    const beneficiaries = await getBeneficiaries({
        application_status,
        status,
        page,
        limit,
        search,
        sortBy,
        sortOrder,
    });
    return res.status(200).json(new APIResponse(200, beneficiaries, "Query Successful"));
};

export const viewBeneficiaryProfile = async (req, res) => {
    const { bid } = req.params;
    const beneficiary = await getBeneficiary(bid);
    return res
        .status(200)
        .json(new APIResponse(200, beneficiary, "Successfully retrieved profile."));
};

export const registerBeneficiary = async (req, res) => {
    const {
        name,
        caregiver,
        caregiver_email,
        caregiver_phone,
        birth_date,
        weight_kg,
        feeding_requirement_mll,
        profile,
    } = req.body;
    const modified_by = req?.user?.user_id || "00000000-0000-0000-0000-000000000000";
    await uploadBeneficiaryProfileToCloudinary(req, profile);
    const beneficiary = await createBeneficiary({
        name,
        caregiver,
        caregiver_email,
        caregiver_phone,
        birth_date,
        weight_kg,
        feeding_requirement_mll,
        profile,
        modified_by,
    });
    await NotifyStaffNewApplication(
        beneficiary.name,
        "beneficiary",
        beneficiary.bid,
        req?.user?.user_id || "00000000-0000-0000-0000-000000000000",
    );
    return res
        .status(201)
        .json(new APIResponse(201, beneficiary, "Created beneficiary successfully"));
};

export const updateBeneficiaryInformation = async (req, res) => {
    const {
        name,
        caregiver,
        caregiver_email,
        caregiver_phone,
        birth_date,
        weight_kg,
        feeding_requirement_mll,
        profile,
    } = req.body;
    const { bid } = req.params;
    const modified_by = req.user.user_id;
    await uploadBeneficiaryProfileToCloudinary(req, profile);
    const beneficiary = await updateBeneficiary({
        bid,
        name,
        caregiver,
        caregiver_email,
        caregiver_phone,
        birth_date,
        weight_kg,
        feeding_requirement_mll,
        profile,
        modified_by,
    });
    return res
        .status(201)
        .json(new APIResponse(200, beneficiary, "Updated beneficiary successfully"));
};

export const approveBeneficiary = async (req, res) => {
    const { dtn } = req.params;
    const updatedBeneficiary = await updateBeneficiaryApplicationStatus({
        dtn,
        application_status: "approved",
    });
    await SendApproval(updatedBeneficiary, "beneficiary");
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, "Beneficiary has been approved"));
};

export const rejectBeneficiary = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    const updatedBeneficiary = await updateBeneficiaryApplicationStatus({
        dtn,
        application_status: "rejected",
        modified_by,
    });
    await SendRejection(updatedBeneficiary, "beneficiary");
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, "Beneficiary has been rejected"));
};

export const activateBeneficiary = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    const updatedBeneficiary = await updateBeneficiaryStatus({
        dtn,
        status: "active",
        modified_by,
    });
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, "Beneficiary has been activated"));
};

export const deactivateBeneficiary = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    const updatedBeneficiary = await updateBeneficiaryStatus({
        dtn,
        status: "inactive",
        modified_by,
    });
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, "Beneficiary has been deactivated"));
};

export const removeBeneficiary = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    await deleteBeneficiary({ dtn, modified_by });
    return res
        .status(200)
        .json(new APIResponse(200, null, "Beneficiary has been successfully deleted"));
};
