import { getDashboardMetrics, getDashboardTrends } from "../services/dashboard.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const GetDashboardMetrics = async (req, res) => {
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
};

export const GetDashboardTrends = async (req, res) => {
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
};
