import { SendApproval, SendRejection } from "../service/email.service.js";
import { NotifyStaffNewApplication } from "../service/notification.service.js";
import {
    createDonor,
    deleteDonor,
    getDonor,
    getDonors,
    updateDonor,
    updateDonorApplicationStatus,
    updateDonorStatus,
} from "../service/donor.service.js";
import { APIResponse } from "../utils/apiResponse.js";
import { uploadImageToCloudinary } from "../service/upload.service.js";

export const queryDonors = async (req, res) => {
    const { application_status, status, page, limit, search, sortBy, sortOrder } = req.query;
    const donors = await getDonors({
        application_status,
        status,
        page,
        limit,
        search,
        sortBy,
        sortOrder,
    });
    return res.status(200).json(new APIResponse(200, donors, "Query Successful"));
};

export const viewDonorProfile = async (req, res) => {
    const { dtn } = req.params;
    const donor = await getDonor(dtn);
    return res.status(200).json(new APIResponse(200, donor, "Successfully retrieved profile."));
};

export const registerDonor = async (req, res) => {
    const { name, email, phone, birth_date, profile } = req.body;
    const modified_by = req?.user?.user_id || "00000000-0000-0000-0000-000000000000";
    if (req.file) {
        const image = await uploadImageToCloudinary(req.file.buffer, "donor_profile");
        profile.personal_information.profile_image_url = image.secure_url;
    }
    const donor = await createDonor({ name, email, phone, birth_date, profile, modified_by });
    await NotifyStaffNewApplication(name, "donor", donor.dtn, modified_by);
    return res.status(201).json(new APIResponse(200, donor, "Donor has been registered"));
};

export const updateDonorInformation = async (req, res) => {
    const { name, email, phone, birth_date, profile } = req.body;
    const { dtn } = req.params;
    const modified_by = req?.user?.user_id || "00000000-0000-0000-0000-000000000000";
    if (req.file) {
        const image = await uploadImageToCloudinary(req.file.buffer, "donor_profile");
        profile.personal_information.profile_image_url = image.secure_url;
    }
    const updatedDonor = await updateDonor({
        dtn,
        name,
        email,
        phone,
        birth_date,
        profile,
        modified_by,
    });
    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been updated"));
};

export const approveDonor = async (req, res) => {
    const { dtn } = req.params;
    const updatedDonor = await updateDonorApplicationStatus({
        dtn,
        application_status: "approved",
    });
    await SendApproval(updatedDonor, "donor");
    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been approved"));
};

export const rejectDonor = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    const updatedDonor = await updateDonorApplicationStatus({
        dtn,
        application_status: "rejected",
        modified_by,
    });
    await SendRejection(updatedDonor, "donor");
    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been rejected"));
};

export const activateDonor = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    const updatedDonor = await updateDonorStatus({ dtn, status: "active", modified_by });
    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been activated"));
};

export const deactivateDonor = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    const updatedDonor = await updateDonorStatus({ dtn, status: "inactive", modified_by });
    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been deactivated"));
};

export const removeDonor = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user.user_id;
    await deleteDonor({ dtn, modified_by });
    return res.status(200).json(new APIResponse(200, null, "Donor has been successfully deleted"));
};
