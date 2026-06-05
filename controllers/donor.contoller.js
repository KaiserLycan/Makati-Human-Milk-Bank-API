import {prisma} from "../db/db.ts";

export const GetDonors = async (req, res) => {
    try {
        const {application_status} = req.query;
        let donors;

        if(application_status) {
            if(application_status !== "pending" && application_status !== "rejected" && application_status !== "approved")
                return res.status(404).json({message:"Not found"});

            donors = await prisma.donor.findMany({
                where: {
                    application_status
                },
                omit: {
                    created_at: true,
                    modified_by: true,
                    modified_at: true
                }
            })
        }
        else {
            donors = await prisma.donor.findMany({
                omit: {
                    modified_at: true,
                    created_at: true,
                    modified_by: true,
                }
            })

        }

        if(donors.length === 0) return res.status(200).json({message: "There is no existing donor records."});
        return res.status(200).json(donors);
    }
    catch (error) {
        console.log("Error in getDonors");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const GetDonor = async (req, res) => {
    try {
        const {dtn} = req.params;

        const donor = await prisma.donor.findUniqueOrThrow({
            where: {
                dtn: Number(dtn)
            },
            omit: {
                created_at: true,
                modified_by: true,
                modified_at: true
            }
        })

        return res.status(200).json(donor);
    }
    catch (error) {
        if(error.code === "P2025") return res.status(4040).json({message:"Not Found"});
        console.log("Error in getDonor");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const RegisterDonor = async (req, res) => {
    try {
        const {application} = req.body;

        if(!application) return res.status(400).json({message: "No application provided."});

        const donor = await prisma.donor.create({
            data: {
                name: application.name,
                email: application.email,
                phone: application.phone,
                birth_date: new Date(application.birth_date),
                profile: application.profile,
                modified_by: req?.user?.user_id || "00000000-0000-0000-0000-000000000000"
            },
            omit: {
                modified_at: true,
                created_at: true,
                modified_by: true,
            }
        })

        if(!donor) return res.status(400).json({message:"Cannot register donor. Check for missing values."});

        return res.status(201).json(donor);
    }
    catch (error) {
        if(error.code === "P2002") return res.status(400).json({message:"Email has already been registered."});
        console.log("Error in registerDonor");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const UpdateApplicationStatus = async (req, res) => {
    try {
        const {application_status} = req.body;
        const {dtn} = req.params;

        if(!application_status) return res.status(400).json({error: "application_status property is not defined."});
        if(application_status !== "approved" && application_status !== "rejected") return res.status(400).json({error: "Invalid request. application status must be approved or rejected only."});

        const donor = await prisma.donor.update({
            where: {
                dtn: parseInt(dtn),
                application_status: "pending",
            },
            data: {
                application_status: application_status
            },
            omit: {
                modified_at: true,
                created_at: true,
                modified_by: true,
            }
        })

        return res.status(200).json(donor);
    }
    catch (error) {
        if (error.code === "P2025") return res.status(400).json({error: "Cannot find application record with a pending status."})

        console.log("Error in updateApplication");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const DeleteDonor = async (req, res) => {
    try {
        const {dtn} = req.params;

        //Update the modified_by so when the deletion is logged it logs the correct user.
        await prisma.donor.update({
            data: {
              modified_by: req.user.user_id
            },
            where: {
                dtn: Number(dtn)
            }
        })

        const donor = await prisma.donor.delete({
            where: {
                dtn: Number(dtn)
            },
            omit: {
                modified_at: true,
                created_at: true,
                modified_by: true,
            }
        })

        return res.status(204).send();
    }
    catch (error) {
        if(error.code === "P2025") return res.status(404).json({message:"Not Found"});
        console.log("Error in deleteDonor");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const UpdateDonor = async (req, res) => {
    try {

        const {dtn} = req.params;
        const {donor} = req.body;

        if(!donor) return res.status(400).json({message:"No information provided."});

        const updated_donor = await prisma.donor.update({
            data: {
                name: donor.name,
                phone: donor.phone,
                email: donor.email,
                birth_date: new Date(donor.birth_date),
                profile: donor.profile,
                modified_by: req.user.user_id
            },
            where: {
                dtn: Number(dtn)
            },
            omit: {
                modified_at: true,
                created_at: true,
                modified_by: true,
            }
        })

        return res.status(200).json(updated_donor);
    }
    catch (error) {
        if(error.code === "P2025") return res.status(404).json({message:"Not Found"});
        if(error.code === "P2002") return res.status(400).json({message:"Email already exists"});

        console.log("Error in updateDonor");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

