import {
    registerDonor as registerDonorService,
    deleteDonor as deleteDonorService,
    fetchDonorDetails,
    fetchDonors,
    updateDonor as updateDonorService,
    updateDonorApplicationStatus,
    updateDonorStatus,
} from "../services/donor.services.js";
import { sendDonorApproval, sendDonorRejection } from "../services/email.services.js";
import { NotifyStaffNewApplication } from "../services/notification.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const queryDonors = async (req, res) => {
    const donors = await fetchDonors(req.query);
    return res.status(200).json(new APIResponse(200, donors, "Query Successful"));
};

export const viewDonorProfile = async (req, res) => {
    const { dtn } = req.params;
    const donor = await fetchDonorDetails(dtn);
    return res.status(200).json(new APIResponse(200, donor, "Successfully retrieved profile."));
};

export const registerDonor = async (req, res) => {
    const donor = await registerDonorService(req);
    const { name, dtn } = donor;
    const modified_by = req.user?.user_id;
    await NotifyStaffNewApplication(name, "donor", dtn, modified_by);
    return res.status(201).json(new APIResponse(201, donor, "Donor has been registered"));
};

export const updateDonorInformation = async (req, res) => {
    const updatedDonor = await updateDonorService(req);
    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been updated"));
};

export const approveDonor = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user?.user_id;

    const updatedDonor = await updateDonorApplicationStatus({
        dtn,
        application_status: "approved",
        modified_by,
    });

    await sendDonorApproval(updatedDonor.email, updatedDonor.name);

    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been approved"));
};

export const rejectDonor = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user?.user_id;

    const updatedDonor = await updateDonorApplicationStatus({
        dtn,
        application_status: "rejected",
        modified_by,
    });

    await sendDonorRejection(updatedDonor.email, updatedDonor.name);

    return res.status(200).json(new APIResponse(200, updatedDonor, "Donor has been rejected"));
};

export const toggleDonorStatus = async (req, res) => {
    const { dtn } = req.params;
    const modified_by = req.user?.user_id;

    const updatedDonor = await updateDonorStatus({ dtn, modified_by });
    const { account_status } = updatedDonor;

    return res
        .status(200)
        .json(new APIResponse(200, updatedDonor, `Donor has been ${account_status}`));
};

export const removeDonor = async (req, res) => {
    const { dtn } = req.params;

    await deleteDonorService(dtn);

    return res.status(200).json(new APIResponse(200, null, "Donor has been successfully deleted"));
};
