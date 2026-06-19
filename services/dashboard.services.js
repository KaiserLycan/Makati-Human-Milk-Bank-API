import { prisma } from "../library/db/db.ts";
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    eachMonthOfInterval,
    format,
    isSameDay,
    isSameMonth,
} from "date-fns";

const getDateRange = (range) => {
    const now = new Date();
    if (range === "week") {
        return {
            startDate: startOfWeek(now, { weekStartsOn: 1 }),
            endDate: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
    if (range === "month") {
        return {
            startDate: startOfMonth(now),
            endDate: endOfMonth(now),
        };
    }
    if (range === "year") {
        return {
            startDate: startOfYear(now),
            endDate: endOfYear(now),
        };
    }
    throw new Error("Invalid range");
};

export const getDashboardMetrics = async (range) => {
    const { startDate, endDate } = getDateRange(range);
    const dateFilter = { gte: startDate, lte: endDate };

    const [
        activeDonors,
        activeBeneficiaries,
        collectedMilk,
        processedMilk,
        dispensedMilk,
        rawWaste,
        poolWaste,
        pasteurizedWaste,
    ] = await Promise.all([
        prisma.donor.count({
            where: {
                application_status: "approved",
                account_status: "active",
                joined_date: dateFilter,
            },
        }),
        prisma.beneficiary.count({
            where: {
                application_status: "approved",
                account_status: "active",
                joined_date: dateFilter,
            },
        }),
        prisma.raw_milk.aggregate({
            _sum: { volume_ml: true },
            where: { milk_status: "good", collection_date: dateFilter },
        }),
        prisma.pasteurized_milk.aggregate({
            _sum: { volume_ml: true },
            where: { processed_date: dateFilter },
        }),
        prisma.pasteurized_milk.aggregate({
            _sum: { volume_ml: true },
            where: { dispense_status: "dispensed", modified_at: dateFilter },
        }),
        prisma.raw_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                milk_status: { in: ["discarded", "contaminated", "expired"] },
                collection_date: dateFilter,
            },
        }),
        prisma.pool_milk.aggregate({
            _sum: { actual_volume_ml: true },
            where: {
                milk_status: { in: ["discarded", "contaminated", "expired"] },
                pooled_date: dateFilter,
            },
        }),
        prisma.pasteurized_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                milk_status: { in: ["discarded", "contaminated", "expired"] },
                processed_date: dateFilter,
            },
        }),
    ]);

    const totalRawWaste = rawWaste._sum.volume_ml || 0;
    const totalPoolWaste = poolWaste._sum.actual_volume_ml || 0;
    const totalPasteurizedWaste = pasteurizedWaste._sum.volume_ml || 0;
    const totalWaste = totalRawWaste + totalPoolWaste + totalPasteurizedWaste;

    return {
        timeframe: { range, start: startDate, end: endDate },
        participants: { donors: activeDonors, beneficiaries: activeBeneficiaries },
        milk_volumes_ml: {
            collected: collectedMilk._sum.volume_ml || 0,
            processed: processedMilk._sum.volume_ml || 0,
            dispensed: dispensedMilk._sum.volume_ml || 0,
        },
        waste_volumes_ml: {
            total_discarded: totalWaste,
            breakdown: {
                raw_stage: totalRawWaste,
                pool_stage: totalPoolWaste,
                pasteurized_stage: totalPasteurizedWaste,
            },
        },
    };
};

export const getDashboardTrends = async (range) => {
    const { startDate, endDate } = getDateRange(range);
    const dateFilter = { gte: startDate, lte: endDate };

    let intervals, formatString, compareFunc;
    if (range === "week") {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatString = "EEE";
        compareFunc = isSameDay;
    } else if (range === "month") {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatString = "dd MMM";
        compareFunc = isSameDay;
    } else {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatString = "MMM";
        compareFunc = isSameMonth;
    }

    const [collectedData, processedData, dispensedData] = await Promise.all([
        prisma.raw_milk.findMany({
            where: { milk_status: "good", collection_date: dateFilter },
            select: { volume_ml: true, collection_date: true },
        }),
        prisma.pasteurized_milk.findMany({
            where: { processed_date: dateFilter },
            select: { volume_ml: true, processed_date: true },
        }),
        prisma.pasteurized_milk.findMany({
            where: { dispense_status: "dispensed", modified_at: dateFilter },
            select: { volume_ml: true, modified_at: true },
        }),
    ]);

    const trendData = intervals.map((intervalDate) => {
        const collected = collectedData
            .filter((d) => compareFunc(new Date(d.collection_date), intervalDate))
            .reduce((sum, d) => sum + d.volume_ml, 0);
        const processed = processedData
            .filter((d) => compareFunc(new Date(d.processed_date), intervalDate))
            .reduce((sum, d) => sum + d.volume_ml, 0);
        const dispensed = dispensedData
            .filter((d) => compareFunc(new Date(d.modified_at), intervalDate))
            .reduce((sum, d) => sum + d.volume_ml, 0);

        return {
            label: format(intervalDate, formatString),
            collected,
            processed,
            dispensed,
        };
    });

    return { range, data: trendData };
};
