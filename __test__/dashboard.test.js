import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

const mockGetDashboardMetrics = jest.fn((req, res) => {
    if (!["week", "month", "year"].includes(req.query.range)) {
        return res.status(400).json({ error: "Invalid range." });
    }
    res.status(200).json({
        success: true,
        data: {},
        message: "Successfully retrieved dashboard metrics.",
    });
});

const mockGetDashboardTrends = jest.fn((req, res) => {
    if (!["week", "month", "year"].includes(req.query.range)) {
        return res.status(400).json({ error: "Invalid range." });
    }
    res.status(200).json({
        success: true,
        data: {},
        message: "Successfully retrieved dashboard trends.",
    });
});

jest.mock("../controllers/dashboard.controllers.js", () => ({
    GetDashboardMetrics: (req, res) => mockGetDashboardMetrics(req, res),
    GetDashboardTrends: (req, res) => mockGetDashboardTrends(req, res),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

describe("Dashboard Router", () => {
    let app;

    beforeEach(async () => {
        const dashboardRouter = (await import("../routers/dashboard.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/dashboard", dashboardRouter);
    });

    describe("GET /summary", () => {
        it("should return dashboard metrics for the week", async () => {
            const response = await request(app).get("/dashboard/summary?range=week");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return dashboard metrics for the month", async () => {
            const response = await request(app).get("/dashboard/summary?range=month");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return dashboard metrics for the year", async () => {
            const response = await request(app).get("/dashboard/summary?range=year");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 400 for an invalid range", async () => {
            const response = await request(app).get("/dashboard/summary?range=invalid");
            expect(response.status).toBe(400);
        });
    });

    describe("GET /trends", () => {
        it("should return dashboard trends for the week", async () => {
            const response = await request(app).get("/dashboard/trends?range=week");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return dashboard trends for the month", async () => {
            const response = await request(app).get("/dashboard/trends?range=month");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return dashboard trends for the year", async () => {
            const response = await request(app).get("/dashboard/trends?range=year");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 400 for an invalid range", async () => {
            const response = await request(app).get("/dashboard/trends?range=invalid");
            expect(response.status).toBe(400);
        });
    });
});
