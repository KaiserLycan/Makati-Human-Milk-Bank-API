import { prisma } from "../../../lib/db/db.ts";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfYear,
    endOfYear,
} from "date-fns";

import { generatePDF } from "../../../lib/utils/pdfGenerator.js";

export const ExportCollectionReport = async (req, res) => {
    try {
        const { range } = req.query; // Grab the range from the URL
        const now = new Date();
        let startDate, endDate;

        if (range === "week") {
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else if (range === "year") {
            startDate = startOfYear(now);
            endDate = endOfYear(now);
        } else {
            // Default to month if they don't provide a range
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }
        const collections = await prisma.raw_milk.findMany({
            where: { collection_date: { gte: startDate, lte: endDate } },
            orderBy: { collection_date: "desc" },
        });

        let totalVolume = 0;
        let totalWaste = 0;

        const formattedRecords = collections.map((record) => {
            const isGood = record.milk_status === "good";

            if (isGood) totalVolume += Number(record.volume_ml);
            else totalWaste += Number(record.volume_ml);

            return {
                date: format(new Date(record.collection_date), "MMM dd, yyyy"),
                dtn: record.dtn,
                program: record.program,
                volume_ml: Number(record.volume_ml),
                status: record.milk_status.toUpperCase(),
                isGood: isGood,
            };
        });

        const reportData = {
            dateRange: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
            generatedDate: format(now, "MMM dd, yyyy HH:mm"),
            totalVolume,
            totalWaste,
            records: formattedRecords,
        };

        const pdfBuffer = await generatePDF("collectionReport", reportData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=MHMB_Collection_Report.pdf");
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.log("Error generating Collection PDF:");
        console.log(error);
        return res.status(500).json({ error: "Failed to generate PDF report" });
    }
};

export const ExportProcessingReport = async (req, res) => {
    try {
        const { range } = req.query; // Grab the range from the URL
        const now = new Date();
        let startDate, endDate;

        if (range === "week") {
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else if (range === "year") {
            startDate = startOfYear(now);
            endDate = endOfYear(now);
        } else {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }

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
            volume_ml: Number(record.volume_ml),
            mbt_status: record.mbt_status ? record.mbt_status.toUpperCase() : "PENDING",
            mbt_class: record.mbt_status || "pending", // Used for CSS styling in Handlebars
        }));

        const reportData = {
            dateRange: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
            generatedDate: format(now, "MMM dd, yyyy HH:mm"),
            totalBatches: uniqueBatches,
            totalBottles,
            passRate,
            records: formattedRecords,
        };

        const pdfBuffer = await generatePDF("processingReport", reportData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=MHMB_Processing_Report.pdf");
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.log("Error generating Processing PDF:");
        console.log(error);
        return res.status(500).json({ error: "Failed to generate PDF report" });
    }
};

export const ExportDispensingReport = async (req, res) => {
    try {
        const { range } = req.query; // Grab the range from the URL
        const now = new Date();
        let startDate, endDate;

        if (range === "week") {
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else if (range === "year") {
            startDate = startOfYear(now);
            endDate = endOfYear(now);
        } else {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }

        const dispensedMilk = await prisma.pasteurized_milk.findMany({
            where: {
                dispense_status: "dispensed",
                modified_at: { gte: startDate, lte: endDate },
            },
            orderBy: { modified_at: "desc" },
        });

        let totalVolume = 0;

        const formattedRecords = dispensedMilk.map((record) => {
            totalVolume += Number(record.volume_ml);
            return {
                date: format(new Date(record.modified_at), "MMM dd, yyyy"),
                btl_id: record.btl_id,
                batch_number: record.batch_number,
                volume_ml: Number(record.volume_ml),
            };
        });

        const reportData = {
            dateRange: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
            generatedDate: format(now, "MMM dd, yyyy HH:mm"),
            totalBottles: dispensedMilk.length,
            totalVolume,
            records: formattedRecords,
        };

        const pdfBuffer = await generatePDF("dispensingReport", reportData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=MHMB_Dispensing_Report.pdf");
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.log("Error generating Dispensing PDF:");
        console.log(error);
        return res.status(500).json({ error: "Failed to generate PDF report" });
    }
};
