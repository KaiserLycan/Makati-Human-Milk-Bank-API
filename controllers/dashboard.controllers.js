import { getDashboardMetrics, getDashboardTrends } from "../services/dashboard.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";
import { logger } from "../library/utils/logger.js";

export const GetDashboardMetrics = async (req, res) => {
    try {
        const { range } = req.query;
        if (!["week", "month", "year"].includes(range)) {
            return res.status(400).json({
                error: "Invalid range. Use '?range=week', '?range=month', or '?range=year'.",
            });
        }
        const metrics = await getDashboardMetrics(range);
        return res
            .status(200)
            .json(new APIResponse(200, metrics, "Successfully retrieved dashboard metrics."));
    } catch (error) {
        logger.error("GetDashboardMetrics Error:", error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
};

export const GetDashboardTrends = async (req, res) => {
    try {
        const { range } = req.query;
        if (!["week", "month", "year"].includes(range)) {
            return res.status(400).json({
                error: "Invalid range. Use '?range=week', '?range=month', or '?range=year'.",
            });
        }
        const trends = await getDashboardTrends(range);
        return res
            .status(200)
            .json(new APIResponse(200, trends, "Successfully retrieved dashboard trends."));
    } catch (error) {
        logger.error("GetDashboardTrends Error:", error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
};
