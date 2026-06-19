import {
    createBeneficiary as createBeneficiaryService,
    deleteBeneficiary as deleteBeneficiaryService,
    fetchBeneficiaries,
    fetchBeneficiaryDetails,
    updateBeneficiary as updateBeneficiaryService,
    updateBeneficiaryApplicationStatus,
    toggleBeneficiaryStatus as toggleBeneficiaryStatusService,
} from "../services/beneficiary.services.js";
import { sendBeneficiaryApproval, sendBeneficiaryRejection } from "../services/email.services.js";
import { NotifyStaffNewApplication } from "../services/notification.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";
import { uploadBeneficiaryProfileToCloudinary } from "../services/cloudinary.services.js";
import { deepmerge } from "deepmerge-ts";

export const queryBeneficiaries = async (req, res) => {
    const beneficiaries = await fetchBeneficiaries(req.query);
    return res.status(200).json(new APIResponse(200, beneficiaries, "Query Successful"));
};

export const viewBeneficiaryProfile = async (req, res) => {
    const { bid } = req.params;
    const beneficiary = await fetchBeneficiaryDetails(bid);
    return res
        .status(200)
        .json(new APIResponse(200, beneficiary, "Successfully retrieved profile."));
};

export const registerBeneficiary = async (req, res) => {
    const modified_by = req.user?.user_id;
    await uploadBeneficiaryProfileToCloudinary(req, req.body.profile);
    const beneficiary = await createBeneficiaryService({ ...req.body, modified_by });
    await NotifyStaffNewApplication(beneficiary.name, "beneficiary", beneficiary.bid, modified_by);
    return res
        .status(201)
        .json(new APIResponse(201, beneficiary, "Created beneficiary successfully"));
};

export const updateBeneficiaryInformation = async (req, res) => {
    const { bid } = req.params;
    const modified_by = req.user.user_id;
    const existingBeneficiary = await fetchBeneficiaryDetails(bid);
    const updatedProfile = deepmerge(existingBeneficiary.profile, req.body.profile);
    const beneficiaryData = { ...req.body, profile: updatedProfile, modified_by };
    await uploadBeneficiaryProfileToCloudinary(
        req,
        beneficiaryData.profile,
        existingBeneficiary.profile,
    );
    const beneficiary = await updateBeneficiaryService(bid, beneficiaryData);
    return res
        .status(200)
        .json(new APIResponse(200, beneficiary, "Updated beneficiary successfully"));
};

export const approveBeneficiary = async (req, res) => {
    const { bid } = req.params;
    const modified_by = req.user.user_id;
    const updatedBeneficiary = await updateBeneficiaryApplicationStatus({
        bid,
        application_status: "approved",
        modified_by,
    });
    await sendBeneficiaryApproval(updatedBeneficiary.caregiver_email, updatedBeneficiary.name);
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, "Beneficiary has been approved"));
};

export const rejectBeneficiary = async (req, res) => {
    const { bid } = req.params;
    const modified_by = req.user.user_id;
    const updatedBeneficiary = await updateBeneficiaryApplicationStatus({
        bid,
        application_status: "rejected",
        modified_by,
    });
    await sendBeneficiaryRejection(updatedBeneficiary);
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, "Beneficiary has been rejected"));
};

export const toggleBeneficiaryStatus = async (req, res) => {
    const { bid } = req.params;
    const modified_by = req.user.user_id;
    const updatedBeneficiary = await toggleBeneficiaryStatusService(bid, modified_by);
    const { account_status } = updatedBeneficiary;
    return res
        .status(200)
        .json(new APIResponse(200, updatedBeneficiary, `Beneficiary has been ${account_status}`));
};

export const removeBeneficiary = async (req, res) => {
    const { bid } = req.params;
    await deleteBeneficiaryService(bid);
    return res
        .status(200)
        .json(new APIResponse(200, null, "Beneficiary has been successfully deleted"));
};
