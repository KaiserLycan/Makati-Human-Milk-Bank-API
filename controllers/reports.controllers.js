import {
    generateCollectionReport,
    generateProcessingReport,
    generateDispensingReport,
    getCollectionReportData,
    getProcessingReportData,
    getDispensingReportData,
} from "../services/reports.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

const sendPdfResponse = (res, pdfBuffer, filename) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(200).send(pdfBuffer);
};

export const ExportCollectionReport = async (req, res) => {
    const { range } = req.query;
    const pdfBuffer = await generateCollectionReport(range);
    sendPdfResponse(res, pdfBuffer, "MHMB_Collection_Report.pdf");
};

export const ExportProcessingReport = async (req, res) => {
    const { range } = req.query;
    const pdfBuffer = await generateProcessingReport(range);
    sendPdfResponse(res, pdfBuffer, "MHMB_Processing_Report.pdf");
};

export const ExportDispensingReport = async (req, res) => {
    const { range } = req.query;
    const pdfBuffer = await generateDispensingReport(range);
    sendPdfResponse(res, pdfBuffer, "MHMB_Dispensing_Report.pdf");
};

export const GetCollectionReportData = async (req, res) => {
    const { range } = req.query;
    if (range && !["week", "month", "year"].includes(range)) {
        return res.status(400).json({
            error: "Invalid range. Use '?range=week', '?range=month', or '?range=year'.",
        });
    }
    const data = await getCollectionReportData(range);
    return res
        .status(200)
        .json(new APIResponse(200, data, "Successfully retrieved collection report data."));
};

export const GetProcessingReportData = async (req, res) => {
    const { range } = req.query;
    if (range && !["week", "month", "year"].includes(range)) {
        return res.status(400).json({
            error: "Invalid range. Use '?range=week', '?range=month', or '?range=year'.",
        });
    }
    const data = await getProcessingReportData(range);
    return res
        .status(200)
        .json(new APIResponse(200, data, "Successfully retrieved processing report data."));
};

export const GetDispensingReportData = async (req, res) => {
    const { range } = req.query;
    if (range && !["week", "month", "year"].includes(range)) {
        return res.status(400).json({
            error: "Invalid range. Use '?range=week', '?range=month', or '?range=year'.",
        });
    }
    const data = await getDispensingReportData(range);
    return res
        .status(200)
        .json(new APIResponse(200, data, "Successfully retrieved dispensing report data."));
};
