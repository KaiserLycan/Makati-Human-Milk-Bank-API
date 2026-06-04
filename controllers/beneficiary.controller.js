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

}

export const UpdateApplicationStatus = async (req, res) => {

}

export const DeleteBeneficiary = async (req, res) => {

}

export const UpdateBeneficiary = async (req, res) => {

}