import { fetchAuditLogs, retrieveAuditLogById } from "../services/audit.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const queryAuditLogs = async (req, res) => {
    const audits = await fetchAuditLogs(req.query);
    return res.status(200).json(new APIResponse(200, audits, "Successfully queried"));
};

export const getAuditByID = async (req, res) => {
    const { log_id } = req.params;
    const log = await retrieveAuditLogById(log_id);
    return res.status(200).json(new APIResponse(200, log, "Successfully retrieved log details"));
};
