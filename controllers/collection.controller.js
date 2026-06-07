import { prisma } from "../db/db.ts";

export const GetCollections = async (req, res) => {
    try {
        const collections = await prisma.raw_milk.findMany();
        return res.status(200).json(collections);

    } catch (error) {
        console.log("Error in GetCollections Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const LogSupsupTodoCollection = async (req, res) => {
    try {
        const {dtn, volume_ml, expiration_date, health_center, remarks} = req.body;
        const user_id = req.user.user_id;

        if (!health_center) {
            return res.status(400).json({ error: "Health center is required." });
        }

        const newCollection = await prisma.raw_milk.create({
            data: {
                dtn: parseInt(dtn),
                program: 'ST',
                health_center: health_center,
                volume_ml: volume_ml,
                expiration_date: new Date(expiration_date),
                collected_by: user_id,
                modified_by: user_id,
                remarks: remarks || null,
            }
        });
        return res.status(201).json(newCollection);

    } catch (error) {
        console.log("Error in LogSupsupTodoCollection Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const LogMomsActCollection = async (req, res) => {
    try {
        const {dtn, volume_ml, expiration_date, pickup_date, remarks} = req.body;
        const user_id = req.user.user_id;

        const newCollection = await prisma.raw_milk.create({
            data: {
                dtn: parseInt(dtn),
                program: 'MA',
                pickup_date: pickup_date ? new Date(pickup_date) : new Date(),
                volume_ml: volume_ml,
                expiration_date: new Date(expiration_date),
                collected_by: user_id,
                modified_by: user_id,
                remarks: remarks || null,
            }
        });
        return res.status(201).json(newCollection);

    } catch (error) {
        console.log("Error in LogMomsActCollection Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const LogMilkyWayCollection = async (req, res) => {
    try {
        const {dtn, volume_ml, expiration_date, hospital, pickup_date, remarks} = req.body;
        const user_id = req.user.user_id;

        if (!hospital) {
            return res.status(400).json({ error: "Hospital is required." });
        }

        const newCollection = await prisma.raw_milk.create({
            data: {
                dtn: parseInt(dtn),
                program: 'MW',
                hospital: hospital,
                pickup_date: pickup_date ? new Date(pickup_date) : new Date(),
                volume_ml: volume_ml,
                expiration_date: new Date(expiration_date),
                collected_by: user_id,
                modified_by: user_id,
                remarks: remarks || null,
            }
        });
        return res.status(201).json(newCollection);

    } catch (error) {
        console.log("Error in LogMilkyWayCollection Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const LogWalkInCollection = async (req, res) => {
    try {
        const {dtn, volume_ml, expiration_date, remarks} = req.body;
        const user_id = req.user.user_id;

        if (volume_ml < 30 || volume_ml > 240) {
            return res.status(400).json({ error: "Volume must be between 30 and 240 ml." });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const dailyCollections = await prisma.raw_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                dtn: parseInt(dtn),
                collection_date: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                program: 'WI'

            }
        });

        const currentDailyTotal = Number(dailyCollections._sum.volume_ml || 0);

        if (currentDailyTotal + volume_ml > 800) {
            return res.status(400).json({ error: `Collection exceeds daily limit. Current total today is ${currentDailyTotal} ml.` });
        }

        const newCollection = await prisma.raw_milk.create({
            data: {
                dtn: parseInt(dtn),
                program: 'WI',
                volume_ml: volume_ml,
                expiration_date: new Date(expiration_date),
                collected_by: user_id,
                modified_by: user_id,
                remarks: remarks || null,
            }
        });
        return res.status(201).json(newCollection);

    } catch (error) {
        console.log("Error in LogWalkInCollection Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const UpdateCollection = async (req, res) => {
    try {
        const ctn = parseInt(req.params.ctn);
        const { volume_ml, expiration_date, pickup_date, hospital, health_center, remarks } = req.body;
        const user_id = req.user.user_id;

        const existingRecord = await prisma.raw_milk.findUnique({ where: { ctn } });
        if (!existingRecord) {
            return res.status(404).json({ error: "Collection record not found." });
        }

        const updatedCollection = await prisma.raw_milk.update({
            where: { ctn },
            data: {
                volume_ml: volume_ml !== undefined ? volume_ml : existingRecord.volume_ml,
                expiration_date: expiration_date ? new Date(expiration_date) : existingRecord.expiration_date,
                pickup_date: pickup_date ? new Date(pickup_date) : existingRecord.pickup_date,
                hospital: hospital !== undefined ? hospital : existingRecord.hospital,
                health_center: health_center !== undefined ? health_center : existingRecord.health_center,
                remarks: remarks !== undefined ? remarks : existingRecord.remarks,
                modified_by: user_id,
                modified_at: new Date()
            }
        });

        return res.status(200).json(updatedCollection);

    } catch (error) {
        console.log("Error in UpdateCollection Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const DeleteCollection = async (req, res) => {
    try {
        const ctn = parseInt(req.params.ctn);

        await prisma.raw_milk.delete({ where: { ctn } });
        return res.status(200).json({ message: "Collection record deleted successfully." });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Collection record not found." });
        }
        console.log("Error in DeleteCollection Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const PatchMilkStatus = async (req, res) => {
    try {
        const ctn = parseInt(req.params.ctn);
        const {milk_status} = req.body;
        const user_id = req.user.user_id;

        if (!['good', 'contaminated', 'discarded', 'expired'].includes(milk_status)) {
            return res.status(400).json({ error: "Invalid milk status. Allowed values are: good, contaminated, discarded, expired." });
        }

        const updatedCollection = await prisma.raw_milk.update({
            where: { ctn },
            data: {
                milk_status: milk_status,
                modified_by: user_id,
                modified_at: new Date()
            }
        });

        return res.status(200).json(updatedCollection);

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Collection record not found." });
        }
        console.log("Error in PatchMilkStatus Controller:");
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const PatchQATStatus = async (req, res) => {
    try {
        const ctn = parseInt(req.params.ctn);
        const { qat_status } = req.body;
        const user_id = req.user.user_id;

        // Ensure we are checking against the exact new database enums
        if (!['pending', 'pass', 'fail'].includes(qat_status)) {
            return res.status(400).json({ error: "Invalid QAT status. Allowed values are: pending, passed, failed." });
        }

        const updatedCollection = await prisma.raw_milk.update({
            where: { ctn },
            data: {
                qat_status: qat_status,
                modified_by: user_id,
                modified_at: new Date()
            }
        });

        return res.status(200).json(updatedCollection);

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Collection record not found." });
        }
        console.log("Error in PatchQATStatus Controller:");
        console.log(error); // This prints the exact crash reason to your terminal!
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

