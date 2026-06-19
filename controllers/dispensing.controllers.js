import { prisma } from "../library/db/db.ts";

export const GetDispensingQueue = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [queue, total] = await Promise.all([
            prisma.request.findMany({
                where: { request_status: "allocated" },
                orderBy: { requested_date: "asc" },
                skip,
                take: limitNum,
                include: {
                    beneficiary: {
                        select: {
                            bid: true,
                            name: true,
                            caregiver: true,
                            caregiver_email: true,
                            caregiver_phone: true,
                        },
                    },
                    request_bottles: {
                        include: {
                            pasteurized_milk: {
                                select: {
                                    btl_id: true,
                                    volume_ml: true,
                                    expiration_date: true,
                                    bottle: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.request.count({ where: { request_status: "allocated" } }),
        ]);

        return res.status(200).json({
            data: queue,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.log("Error in GetDispensingQueue Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const DispenseMilk = async (req, res) => {
    try {
        const { rid } = req.params;
        const user_id = req.user.user_id;

        const request = await prisma.request.findUniqueOrThrow({
            where: { rid: parseInt(rid) },
            include: {
                request_bottles: {
                    include: {
                        pasteurized_milk: true,
                    },
                },
            },
        });

        if (request.request_status !== "allocated") {
            return res.status(400).json({ error: "Only allocated requests can be dispensed." });
        }

        // Mark all allocated bottles as dispensed
        const bottleIds = request.request_bottles.map((rb) => rb.btl_id);

        await prisma.pasteurized_milk.updateMany({
            where: { btl_id: { in: bottleIds } },
            data: {
                dispense_status: "dispensed",
                modified_by: user_id,
            },
        });

        // Mark request as completed
        const completedRequest = await prisma.request.update({
            where: { rid: parseInt(rid) },
            data: {
                request_status: "completed",
                modified_by: user_id,
            },
            include: {
                beneficiary: {
                    select: {
                        bid: true,
                        name: true,
                        caregiver: true,
                        caregiver_email: true,
                    },
                },
                request_bottles: {
                    include: {
                        pasteurized_milk: {
                            select: {
                                btl_id: true,
                                volume_ml: true,
                                expiration_date: true,
                                dispense_status: true,
                            },
                        },
                    },
                },
            },
        });

        return res.status(200).json(completedRequest);
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "Request not found." });
        console.log("Error in DispenseMilk Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
