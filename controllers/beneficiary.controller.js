import {prisma} from "../db/db.ts";

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

        if (!application_status) return res.status(400).json({error: "application_status property is not defined."});

        const beneficiary = await prisma.beneficiary.update({
            data: {
                application_status
            },
            where: {
                bid: parseInt(bid),
            },
            omit: {
                created_at: true,
                modified_at: true,
                modified_by: true
            }
        })

        if(!beneficiary) return res.status(404).json({error: "Cannot update missing record"});
        return res.status(200).json(beneficiary);
    }
    catch (error) {
        console.log("Error in updateApplicationStatus");
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
}

export const DeleteBeneficiary = async (req, res) => {

}

export const UpdateBeneficiary = async (req, res) => {

}