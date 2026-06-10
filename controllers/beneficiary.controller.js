import {prisma} from "../db/db.ts";
import { SendApproval, SendRejection } from "../service/email.service.js";
import { NotifyStaffNewApplication } from "../service/notification.service.js";

export const GetBeneficiaries = async (req, res) => {
    try {
        const {application_status} = req.query;
        const beneficiaries = await prisma.beneficiary.findMany({
            where: {
                application_status
            },
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true
            }
        })

        if(beneficiaries.length === 0) return res.status(404).json({error: "No records found."});
        return res.status(200).json(beneficiaries)
    }
    catch (error) {
        console.log("Error in getBeneficiaries");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
}

export const GetBeneficiary = async (req, res) => {
    try {
        const {bid} = req.params;

        const beneficiary = await prisma.beneficiary.findUnique({
            where: {
                bid: parseInt(bid),

            },
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true
            }
        })

        if(!beneficiary) return res.status(404).json({error: "No records found."});
        return res.status(200).json(beneficiary);
    }
    catch (error) {
        console.log("Error in getBeneficiary");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
}

export const RegisterBeneficiary = async (req, res) => {
    try {
        const {application} = req.body;

        if(!application) return res.status(400).json({error: "Application property is not defined."});

        const beneficiary = await prisma.beneficiary.create({
            data: {
                name: application.name,
                caregiver: application.caregiver,
                caregiver_email: application.caregiver_email,
                caregiver_phone: application.caregiver_phone,
                birth_date: new Date(application.birth_date),
                weight_kg: application.weight_kg,
                feeding_requirement_ml: application.feeding_requirement_ml,
                profile: application.profile,
                modified_by: req?.user?.user_id || "00000000-0000-0000-0000-000000000000"
            },
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true
            }
        })

        if(!beneficiary) return res.status(400).json({error: "Cannot register beneficiary."});
        try {
            await NotifyStaffNewApplication(
                beneficiary.name, 
                'beneficiary', 
                beneficiary.bid, 
                req?.user?.user_id || "00000000-0000-0000-0000-000000000000"
            );
        } catch (notificationError) {
            console.log("Warning: Notification failed for new beneficiary application", beneficiary.bid);
        }

        return res.status(201).json(beneficiary);
    }
    catch (error) {
        console.log("Error in registerBeneficiary");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }

    
}


export const UpdateApplicationStatus = async (req, res) => {
    try {
        const {application_status} = req.body;
        const {bid} = req.params;

        if (!application_status) 
            return res.status(400).json({error: "application_status property is not defined."});
        if(application_status !== "approved" && application_status !== "rejected") 
            return res.status(400).json({error: "Invalid request. application status must be approved or rejected only."});

        const beneficiary = await prisma.beneficiary.update({
            where: {
                bid: parseInt(bid),
                application_status: "pending"
            },
            data: {
                application_status
            },
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true
            }
        })

        // send notification email to beneficiary
        try {
            if (application_status === "approved") {
                await SendApproval({name: beneficiary.name, email: beneficiary.caregiver_email}, "beneficiary");
            } else if (application_status === "rejected") {
                await SendRejection({name: beneficiary.name, email: beneficiary.caregiver_email}, "beneficiary");
            }
        } catch (emailError) {
            console.log("Warning: Email notification failed for beneficiary", bid);
            console.log(emailError);
            // Don't fail the API call if email fails - still return success
        }

        return res.status(200).json(beneficiary);
    }
    catch (error) {
        if (error.code === "P2025") return res.status(400).json({error: "Cannot find application record with a pending status."})

        console.log("Error in updateApplicationStatus");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
}

export const DeleteBeneficiary = async (req, res) => {
    try {
        const {bid} = req.params;

        await prisma.beneficiary.update({
            data: {
                modified_by: req?.user?.user_id
            },
            where: {
                bid: parseInt(bid),
            }
        })

        await prisma.beneficiary.delete({
            where: {
                bid: parseInt(bid),
            }
        })

        return res.status(204).send();
    }
    catch (error) {
        console.log("Error in deleteBeneficiary");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
}

export const UpdateBeneficiary = async (req, res) => {
    try {
        const {bid} = req.params;
        const {beneficiary} = req.body;

        if(!beneficiary) return res.status(400).json({error: "Beneficiary property is not defined."});

        const updated_beneficiary = await prisma.beneficiary.update({
            data: {
                name: beneficiary.name,
                caregiver: beneficiary.caregiver,
                caregiver_email: beneficiary.caregiver_email,
                caregiver_phone: beneficiary.caregiver_phone,
                birth_date: new Date(beneficiary.birth_date),
                weight_kg: beneficiary.weight_kg,
                feeding_requirement_ml: beneficiary.feeding_requirement_ml,
                profile: beneficiary.profile,
                modified_by: req?.user?.user_id
            },
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true
            },
            where: {
                bid: parseInt(bid),
            }
        })

        return res.status(200).json(updated_beneficiary);
    }
    catch (error) {
        if(error.code === "P2025") return res.status(404).json({error:"No records found."});
        if(error.code === "P2002") return res.status(400).json({error:"Email already exists"});
        console.log("Error in updateBeneficiary");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
}