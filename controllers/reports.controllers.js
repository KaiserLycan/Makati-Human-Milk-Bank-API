import {
    generateCollectionReport,
    generateProcessingReport,
    generateDispensingReport,
} from "../services/reports.services.js";

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
