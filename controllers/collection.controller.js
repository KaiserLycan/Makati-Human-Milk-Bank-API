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