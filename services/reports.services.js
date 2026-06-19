import { prisma } from "../library/db/db.ts";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfYear,
    endOfYear,
} from "date-fns";
import { generatePDF } from "../library/utils/pdfGenerator.js";

const getDateRange = (range) => {
    const now = new Date();
    if (range === "week") {
        return {
            startDate: startOfWeek(now, { weekStartsOn: 1 }),
            endDate: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
    if (range === "year") {
        return {
            startDate: startOfYear(now),
            endDate: endOfYear(now),
        };
    }
    // Default to month
    return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
    };
};

export const generateCollectionReport = async (range) => {
    const { startDate, endDate } = getDateRange(range);
    const collections = await prisma.raw_milk.findMany({
        where: { collection_date: { gte: startDate, lte: endDate } },
        orderBy: { collection_date: "desc" },
    });

    let totalVolume = 0;
    let totalWaste = 0;

    const formattedRecords = collections.map((record) => {
        const isGood = record.milk_status === "good";
        if (isGood) {
            totalVolume += record.volume_ml;
        } else {
            totalWaste += record.volume_ml;
        }
        return {
            date: format(new Date(record.collection_date), "MMM dd, yyyy"),
            dtn: record.dtn,
            program: record.program,
            volume_ml: record.volume_ml,
            status: record.milk_status.toUpperCase(),
            isGood,
        };
    });

    const reportData = {
        dateRange: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
        generatedDate: format(new Date(), "MMM dd, yyyy HH:mm"),
        totalVolume,
        totalWaste,
        records: formattedRecords,
    };

    return generatePDF("collectionReport", reportData);
};

export const generateProcessingReport = async (range) => {
    const { startDate, endDate } = getDateRange(range);
    const processedMilk = await prisma.pasteurized_milk.findMany({
        where: { processed_date: { gte: startDate, lte: endDate } },
        orderBy: { processed_date: "desc" },
    });

    const uniqueBatches = new Set(processedMilk.map((m) => m.batch_number)).size;
    const totalBottles = processedMilk.length;
    const passedBottles = processedMilk.filter((m) => m.mbt_status === "pass").length;
    const passRate = totalBottles > 0 ? ((passedBottles / totalBottles) * 100).toFixed(1) : 0;

    const formattedRecords = processedMilk.map((record) => ({
        date: format(new Date(record.processed_date), "MMM dd, yyyy"),
        batch_number: record.batch_number,
        btl_id: record.btl_id,
        volume_ml: record.volume_ml,
        mbt_status: record.mbt_status ? record.mbt_status.toUpperCase() : "PENDING",
        mbt_class: record.mbt_status || "pending",
    }));

    const reportData = {
        dateRange: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
        generatedDate: format(new Date(), "MMM dd, yyyy HH:mm"),
        totalBatches: uniqueBatches,
        totalBottles,
        passRate,
        records: formattedRecords,
    };

    return generatePDF("processingReport", reportData);
};

export const generateDispensingReport = async (range) => {
    const { startDate, endDate } = getDateRange(range);
    const dispensedMilk = await prisma.pasteurized_milk.findMany({
        where: {
            dispense_status: "dispensed",
            modified_at: { gte: startDate, lte: endDate },
        },
        orderBy: { modified_at: "desc" },
    });

    const totalVolume = dispensedMilk.reduce((sum, record) => sum + record.volume_ml, 0);

    const formattedRecords = dispensedMilk.map((record) => ({
        date: format(new Date(record.modified_at), "MMM dd, yyyy"),
        btl_id: record.btl_id,
        batch_number: record.batch_number,
        volume_ml: record.volume_ml,
    }));

    const reportData = {
        dateRange: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
        generatedDate: format(new Date(), "MMM dd, yyyy HH:mm"),
        totalBottles: dispensedMilk.length,
        totalVolume,
        records: formattedRecords,
    };

    return generatePDF("dispensingReport", reportData);
};
