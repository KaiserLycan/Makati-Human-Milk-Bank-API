import { prisma } from "../../../lib/db/db.ts";

export const UpdateRawMilkQAT = async (req, res) => {
    try {
        const ctn = parseInt(req.params.ctn);
        const { qat_status, remarks } = req.body;
        const user_id = req.user.user_id;

        if (!["pass", "fail"].includes(qat_status)) {
            return res.status(400).json({ error: "Invalid QAT status. Must be 'pass' or 'fail'." });
        }

        const oldMilkData = await prisma.raw_milk.findUnique({
            where: { ctn },
        });

        if (!oldMilkData) {
            return res.status(404).json({ error: "Raw milk record not found." });
        }

        const newMilkStatus = qat_status === "fail" ? "discarded" : "good";

        const updatedMilk = await prisma.raw_milk.update({
            where: { ctn },
            data: {
                qat_status: qat_status,
                milk_status: newMilkStatus,
                remarks: remarks || oldMilkData.remarks,
                modified_by: user_id,
                modified_at: new Date(),
            },
        });

        return res.status(200).json(updatedMilk);
    } catch (error) {
        console.error("Error in UpdateRawMilkQAT Controller:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const LogPrePoolIncident = async (req, res) => {
    try {
        const ctn = parseInt(req.params.ctn);
        const { incident_type, updated_volume_ml, remarks } = req.body;
        const user_id = req.user.user_id;

        const oldMilkData = await prisma.raw_milk.findUnique({
            where: { ctn },
        });

        if (!oldMilkData) {
            return res.status(404).json({ error: "Raw milk record not found." });
        }

        let newStatus = oldMilkData.milk_status;
        let newVolume = oldMilkData.volume_ml;

        if (incident_type === "contamination") {
            newStatus = "contaminated";
        } else if (incident_type === "leakage") {
            if (updated_volume_ml === undefined || updated_volume_ml < 0) {
                return res
                    .status(400)
                    .json({ error: "Valid updated_volume_ml is required for leakage incidents." });
            }
            newVolume = updated_volume_ml;
        } else {
            return res
                .status(400)
                .json({ error: "Invalid incident_type. Must be 'contamination' or 'leakage'." });
        }

        const updatedMilk = await prisma.raw_milk.update({
            where: { ctn },
            data: {
                milk_status: newStatus,
                volume_ml: newVolume,
                remarks: remarks
                    ? `${oldMilkData.remarks ? oldMilkData.remarks + " | " : ""}Incident: ${remarks}`
                    : oldMilkData.remarks,
                modified_by: user_id,
                modified_at: new Date(),
            },
        });

        return res.status(200).json(updatedMilk);
    } catch (error) {
        console.error("Error in LogPrePoolIncident Controller:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
