import { describe, it, expect, jest, beforeAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";

const mockJwtVerify = jest.fn();
const mockUserFindUniqueOrThrow = jest.fn();
const mockRequestFindMany = jest.fn();
const mockRequestFindUniqueOrThrow = jest.fn();
const mockRequestUpdate = jest.fn();
const mockPasteurizedMilkUpdateMany = jest.fn();

jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: {
        verify: (...args) => mockJwtVerify(...args),
    },
    verify: (...args) => mockJwtVerify(...args),
}));

jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        user: {
            findUniqueOrThrow: (...args) => mockUserFindUniqueOrThrow(...args),
        },
        request: {
            findMany: (...args) => mockRequestFindMany(...args),
            findUniqueOrThrow: (...args) => mockRequestFindUniqueOrThrow(...args),
            update: (...args) => mockRequestUpdate(...args),
        },
        pasteurized_milk: {
            updateMany: (...args) => mockPasteurizedMilkUpdateMany(...args),
        }
    }
}));

import DispensingRouter from "../routes/dispensing.router.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/dispensing", DispensingRouter);

describe("Dispensing API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockJwtVerify.mockReturnValue({ user_id: "test-staff-uuid" });
        mockUserFindUniqueOrThrow.mockResolvedValue({ user_id: "test-staff-uuid", role: "staff" });
    });

    describe("GET /api/dispensing", () => {
        it("Should fetch all allocated requests in dispensing queue", async () => {
            const mockQueue = [
                {
                    rid: 1,
                    request_status: "allocated",
                    requested_vol_ml: 150,
                    beneficiary: { bid: 1, name: "Baby Cruz" },
                    request_bottles: [
                        { btl_id: 1, pasteurized_milk: { btl_id: 1, volume_ml: 150 } }
                    ]
                }
            ];
            mockRequestFindMany.mockResolvedValue(mockQueue);

            const res = await request(app)
                .get("/api/dispensing")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockQueue);
        });

        it("Should return empty array if no allocated requests", async () => {
            mockRequestFindMany.mockResolvedValue([]);

            const res = await request(app)
                .get("/api/dispensing")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("Should return 500 on database error", async () => {
            mockRequestFindMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .get("/api/dispensing")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal Server Error");
        });
    });

    describe("PATCH /api/dispensing/:rid/dispense", () => {
        it("Should dispense milk and mark request as completed", async () => {
            const mockRequest = {
                rid: 1,
                request_status: "allocated",
                request_bottles: [
                    { btl_id: 1, pasteurized_milk: { btl_id: 1, volume_ml: 150 } }
                ]
            };

            const mockCompleted = {
                rid: 1,
                request_status: "completed",
                beneficiary: { bid: 1, name: "Baby Cruz" },
                request_bottles: [
                    { btl_id: 1, pasteurized_milk: { btl_id: 1, volume_ml: 150, dispense_status: "dispensed" } }
                ]
            };

            mockRequestFindUniqueOrThrow.mockResolvedValue(mockRequest);
            mockPasteurizedMilkUpdateMany.mockResolvedValue({ count: 1 });
            mockRequestUpdate.mockResolvedValue(mockCompleted);

            const res = await request(app)
                .patch("/api/dispensing/1/dispense")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body.request_status).toBe("completed");
        });

        it("Should return 400 if request is not in allocated status", async () => {
            mockRequestFindUniqueOrThrow.mockResolvedValue({
                rid: 1,
                request_status: "waiting",
                request_bottles: []
            });

            const res = await request(app)
                .patch("/api/dispensing/1/dispense")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Only allocated requests can be dispensed.");
        });

        it("Should return 400 if request is already completed", async () => {
            mockRequestFindUniqueOrThrow.mockResolvedValue({
                rid: 1,
                request_status: "completed",
                request_bottles: []
            });

            const res = await request(app)
                .patch("/api/dispensing/1/dispense")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Only allocated requests can be dispensed.");
        });

        it("Should return 404 if request not found", async () => {
            const error = new Error("Not found");
            error.code = "P2025";
            mockRequestFindUniqueOrThrow.mockRejectedValue(error);

            const res = await request(app)
                .patch("/api/dispensing/999/dispense")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Request not found.");
        });

        it("Should return 500 on database error", async () => {
            mockRequestFindUniqueOrThrow.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .patch("/api/dispensing/1/dispense")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal Server Error");
        });
    });
});