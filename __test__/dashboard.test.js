import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import dashboardRouter from "../routes/dashboard.router.js";

// --- Mocking Prisma ---
const mockCount = jest.fn();
const mockAggregate = jest.fn();
const mockFindMany = jest.fn();

jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        donor: { count: (...args) => mockCount(...args) },
        beneficiary: { count: (...args) => mockCount(...args) },
        raw_milk: { 
            aggregate: (...args) => mockAggregate(...args),
            findMany: (...args) => mockFindMany(...args)
        },
        pool_milk: { aggregate: (...args) => mockAggregate(...args) },
        pasteurized_milk: { 
            aggregate: (...args) => mockAggregate(...args),
            findMany: (...args) => mockFindMany(...args)
        },
        user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ user_id: "test-uuid", role: "staff" }) }
    }
}));

// --- Mocking JWT Auth Middleware ---
jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: { verify: jest.fn().mockReturnValue({ user_id: "test-uuid" }) },
    verify: jest.fn().mockReturnValue({ user_id: "test-uuid" }),
}));

// --- Setup Express App ---
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/dashboard", dashboardRouter);

describe("Dashboard API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/dashboard/summary", () => {
        it("Should successfully return dashboard metrics for a valid range (month)", async () => {
            // Mocking the Prisma responses
            mockCount.mockResolvedValue(10); // 10 Donors/Beneficiaries
            mockAggregate.mockResolvedValue({ _sum: { volume_ml: 5000, actual_volume_ml: 5000 } });

            const res = await request(app)
                .get("/api/dashboard/summary?range=month")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body.timeframe.range).toBe("month");
            expect(res.body.participants.donors).toBe(10);
            expect(res.body.milk_volumes_ml.collected).toBe(5000);
            expect(mockCount).toHaveBeenCalledTimes(2); 
            expect(mockAggregate).toHaveBeenCalledTimes(6); // 3 for totals, 3 for waste
        });

        it("Should return 400 for an invalid range parameter", async () => {
            const res = await request(app)
                .get("/api/dashboard/summary?range=decade")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Invalid range");
        });
    });

    describe("GET /api/dashboard/trends", () => {
        it("Should successfully return trend data for a valid range (week)", async () => {
            // Mocking the raw data fetched for trends
            mockFindMany.mockResolvedValue([
                { volume_ml: 1000, collection_date: new Date(), processed_date: new Date(), modified_at: new Date() }
            ]);

            const res = await request(app)
                .get("/api/dashboard/trends?range=week")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body.range).toBe("week");
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(7); // A week should have 7 days of data
            expect(mockFindMany).toHaveBeenCalledTimes(3); 
        });

        it("Should return 400 for an invalid range parameter", async () => {
            const res = await request(app)
                .get("/api/dashboard/trends?range=invalid")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Invalid range");
        });
    });
});