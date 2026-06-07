import {prisma} from "../db/db.ts";

export const LogPasteurizationBatch = async (req, res) => {
    try {
        const {pid, batch_number, bottle_count, volume_per_bottle, bottle_type, pasteurization_date} = req.body;
        const user_id = req.user.user_id;

        if (!pid || !batch_number || !bottle_count || !volume_per_bottle || !bottle_type || !pasteurization_date) {
            return res.status(400).json({ error: "All fields required: pid, batch_number, bottle_count, volume_per_bottle, bottle_type, pasteurization_date." });
        }

        const pool = await prisma.pool_milk.findUnique({ where: { pid: parseInt(pid) } });
        if (!pool) {
            return res.status(404).json({ error: "Pool with given PID not found." });
        }

        const total_volume = bottle_count * volume_per_bottle;
        if (total_volume > Number(pool.actual_volume_ml)) {
            return res.status(400).json({ error: `Total volume (${total_volume} ml) exceeds pool's actual volume (${pool.actual_volume_ml} ml).` });
        }

        const bottlesToCreate = [];
        for (let i = 1; i <= bottle_count; i++) {
            bottlesToCreate.push({
                pid: parseInt(pid),
                batch_number: parseInt(batch_number),
                bottle_sequence_number: i,
                volume_ml: volume_per_bottle,
                bottle: bottle_type || 'ameda',
                processed_date: new Date(pasteurization_date), 
                expiration_date: pool.expiration_date,
                processed_by: user_id,
                modified_by: user_id,
            });
        }

        const createdBatch = await prisma.pasteurized_milk.createMany({
            data: bottlesToCreate
        });

        return res.status(201).json({ message: `Batch logged successfully with ${bottle_count} bottles.`, batch_number: batch_number });
    } catch (error) {
        console.log("Error in LogPasteurizationBatch Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const ReportPasteurizationIncident = async (req, res) => {
    try {
        const btl_id = parseInt(req.params.btl_id);
        const{volume_ml, milk_status, remarks} = req.body;
        const user_id = req.user.user_id;

        if (milk_status && !['good', 'contaminated', 'discarded', 'expired'].includes(milk_status)) {
            return res.status(400).json({ error: "Invalid milk status. Must be one of: good, contaminated, discarded, expired." });
        }

        const updatedBottle = await prisma.pasteurized_milk.update({
            where: { btl_id },
            data: {
                ...(volume_ml !== undefined && { volume_ml }),
                ...(milk_status !== undefined && { milk_status }),
                ...(remarks !== undefined && { remarks }),
                modified_by: user_id,
                modified_at: new Date()
            }
        });
        return res.status(200).json({ message: "Incident reported and bottle updated successfully.", bottle: updatedBottle });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Bottle record not found." });
        }
        console.log("Error in ReportPasteurizationIncident Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const UpdateMBTStatus = async (req, res) => {
    try{
        const btl_id = parseInt(req.params.btl_id);
        const {mbt_status, remarks} = req.body;
        const user_id = req.user.user_id;

        if (!['pass', 'fail'].includes(mbt_status)) {
            return res.status(400).json({ error: "Invalid MBT status. Must be either 'pass' or 'fail'." });
        }

        let new_milk_status = undefined;
        let new_dispense_status = undefined;

        if (mbt_status === 'fail') {
            new_milk_status = 'discarded';
        } else if (mbt_status === 'pass') {
            new_dispense_status = 'available';
        }

        const updatedBottle = await prisma.pasteurized_milk.update({
            where: { btl_id },
            data: {
                ...(new_milk_status && { milk_status: new_milk_status }),
                ...(new_dispense_status && { dispense_status: new_dispense_status }),
                ...(remarks && { remarks }),
                modified_by: user_id,
                modified_at: new Date()
            }
        });

        return res.status(200).json({ message: "MBT status updated successfully.", bottle: updatedBottle });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Bottle record not found." });
        }
        console.log("Error in UpdateMBTStatus Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}