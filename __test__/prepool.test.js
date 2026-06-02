import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import prepoolRouter from "../routes/prepool.router.js";

// --- Mocking Prisma ---
const mockRawMilkFindUnique = jest.fn();
const mockRawMilkUpdate = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockTransaction = jest.fn();
const mockUserFindUniqueOrThrow = jest.fn();

jest.mock("../db/db.ts", () => {
    return {
        __esModule: true,
        prisma: {
            raw_milk: {
                findUnique: (...args) => mockRawMilkFindUnique(...args),
                update: (...args) => mockRawMilkUpdate(...args),
            },
            audit_log: {
                create: (...args) => mockAuditLogCreate(...args),
            },
            user: {
                findUniqueOrThrow: (...args) => mockUserFindUniqueOrThrow(...args),
            },
            $transaction: (...args) => mockTransaction(...args),
        }
    }
});

// --- Mocking JWT for Auth Middleware ---
const mockJwtVerify = jest.fn();

jest.mock('jsonwebtoken', () => {
    return {
        __esModule: true,
        default: {
            verify: (...args) => mockJwtVerify(...args),
        },
        verify: (...args) => mockJwtVerify(...args),
    }
});

// --- Setup Express App ---
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(prepoolRouter);

describe("Pre-Pooling API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock successful authentication for all protected routes
        mockJwtVerify.mockReturnValue({ user_id: "test-staff-uuid" });
        mockUserFindUniqueOrThrow.mockResolvedValue({ user_id: "test-staff-uuid", role: "staff" });
    });

    describe("PATCH /raw-milk/:ctn/qat", () => {
        
        it("Should update QAT status to 'pass' and keep milk_status as 'good'", async () => {
            const oldMilk = { ctn: 1, milk_status: "good", remarks: "" };
            const updatedMilk = { ctn: 1, qat_status: "pass", milk_status: "good" };
            
            mockRawMilkFindUnique.mockResolvedValue(oldMilk);
            mockTransaction.mockResolvedValue([updatedMilk, {}]);

            const res = await request(app)
                .patch("/raw-milk/1/qat")
                .set("Cookie", ["access_token=valid_token"])
                .send({ qat_status: "pass", remarks: "Looks clean" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("QAT status updated successfully");
            expect(res.body.data.qat_status).toBe("pass");
            expect(mockTransaction).toHaveBeenCalled();
        });

        it("Should update QAT status to 'fail' and automatically change milk_status to 'discarded'", async () => {
            const oldMilk = { ctn: 2, milk_status: "good", remarks: "" };
            const updatedMilk = { ctn: 2, qat_status: "fail", milk_status: "discarded" };
            
            mockRawMilkFindUnique.mockResolvedValue(oldMilk);
            mockTransaction.mockResolvedValue([updatedMilk, {}]);

            const res = await request(app)
                .patch("/raw-milk/2/qat")
                .set("Cookie", ["access_token=valid_token"])
                .send({ qat_status: "fail" });

            expect(res.status).toBe(200);
            expect(res.body.data.milk_status).toBe("discarded");
        });

        it("Should return 400 error for invalid QAT status", async () => {
            const res = await request(app)
                .patch("/raw-milk/1/qat")
                .set("Cookie", ["access_token=valid_token"])
                .send({ qat_status: "maybe" }); // Invalid enum

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Invalid QAT status");
        });

        it("Should return 404 error if CTN does not exist", async () => {
            mockRawMilkFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch("/raw-milk/999/qat")
                .set("Cookie", ["access_token=valid_token"])
                .send({ qat_status: "pass" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Raw milk record not found.");
        });
    });

    describe("PATCH /raw-milk/:ctn/incident", () => {
        
        it("Should record contamination and update milk_status to 'contaminated'", async () => {
            const oldMilk = { ctn: 3, milk_status: "good", volume_ml: 150, remarks: "Initial" };
            const updatedMilk = { ctn: 3, milk_status: "contaminated", volume_ml: 150 };
            
            mockRawMilkFindUnique.mockResolvedValue(oldMilk);
            mockTransaction.mockResolvedValue([updatedMilk, {}]);

            const res = await request(app)
                .patch("/raw-milk/3/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({ incident_type: "contamination", remarks: "Found debris" });

            expect(res.status).toBe(200);
            expect(res.body.data.milk_status).toBe("contaminated");
            expect(mockTransaction).toHaveBeenCalled();
        });

        it("Should record leakage and update volume_ml", async () => {
            const oldMilk = { ctn: 4, milk_status: "good", volume_ml: 200, remarks: "" };
            const updatedMilk = { ctn: 4, milk_status: "good", volume_ml: 180 };
            
            mockRawMilkFindUnique.mockResolvedValue(oldMilk);
            mockTransaction.mockResolvedValue([updatedMilk, {}]);

            const res = await request(app)
                .patch("/raw-milk/4/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({ incident_type: "leakage", updated_volume_ml: 180, remarks: "Leaky cap" });

            expect(res.status).toBe(200);
            expect(res.body.data.volume_ml).toBe(180);
        });

        it("Should return 400 error if leakage incident is missing updated_volume_ml", async () => {
            mockRawMilkFindUnique.mockResolvedValue({ ctn: 5, volume_ml: 100 });

            const res = await request(app)
                .patch("/raw-milk/5/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({ incident_type: "leakage", remarks: "Spilled some" });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Valid updated_volume_ml is required");
        });

        it("Should return 400 error for invalid incident type", async () => {
            mockRawMilkFindUnique.mockResolvedValue({ ctn: 6 });

            const res = await request(app)
                .patch("/raw-milk/6/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({ incident_type: "explosion" });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Invalid incident_type");
        });
    });
});