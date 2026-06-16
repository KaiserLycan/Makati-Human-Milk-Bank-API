import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import reportsRouter from "../routes/reports.router.js";

// --- 1. Mocking the PDF Generator (CRITICAL) ---
const mockGeneratePDF = jest.fn();
jest.mock("../utils/pdfGenerator.js", () => ({
    generatePDF: (...args) => mockGeneratePDF(...args)
}));

// --- 2. Mocking Prisma ---
const mockFindMany = jest.fn();
jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        raw_milk: { findMany: (...args) => mockFindMany(...args) },
        pasteurized_milk: { findMany: (...args) => mockFindMany(...args) },
        user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ user_id: "test-uuid", role: "staff" }) }
    }
}));

// --- 3. Mocking JWT Auth Middleware ---
jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: { verify: jest.fn().mockReturnValue({ user_id: "test-uuid" }) },
    verify: jest.fn().mockReturnValue({ user_id: "test-uuid" }),
}));

// --- Setup Express App ---
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/reports", reportsRouter);

describe("Reports API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Return a fake Buffer instead of a real PDF
        mockGeneratePDF.mockResolvedValue(Buffer.from("fake-pdf-data")); 
    });

    describe("GET /api/reports/collection/export", () => {
        it("Should successfully generate and download the Collection PDF", async () => {
            mockFindMany.mockResolvedValue([
                { volume_ml: 100, milk_status: "good", program: "WI", collection_date: new Date() },
                { volume_ml: 50, milk_status: "discarded", program: "MA", collection_date: new Date() }
            ]);

            const res = await request(app)
                .get("/api/reports/collection/export?range=month")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe('application/pdf');
            expect(res.headers['content-disposition']).toContain('attachment; filename=MHMB_Collection_Report.pdf');
            expect(mockGeneratePDF).toHaveBeenCalledWith('collectionReport', expect.any(Object));
        });
    });

    describe("GET /api/reports/processing/export", () => {
        it("Should successfully generate and download the Processing PDF", async () => {
            mockFindMany.mockResolvedValue([
                { volume_ml: 100, btl_id: 1, batch_number: 101, mbt_status: "pass", processed_date: new Date() }
            ]);

            const res = await request(app)
                .get("/api/reports/processing/export?range=month")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe('application/pdf');
            expect(res.headers['content-disposition']).toContain('attachment; filename=MHMB_Processing_Report.pdf');
            expect(mockGeneratePDF).toHaveBeenCalledWith('processingReport', expect.any(Object));
        });
    });

    describe("GET /api/reports/dispensing/export", () => {
        it("Should successfully generate and download the Dispensing PDF", async () => {
            mockFindMany.mockResolvedValue([
                { volume_ml: 100, btl_id: 1, batch_number: 101, modified_at: new Date() }
            ]);

            const res = await request(app)
                .get("/api/reports/dispensing/export?range=month")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe('application/pdf');
            expect(res.headers['content-disposition']).toContain('attachment; filename=MHMB_Dispensing_Report.pdf');
            expect(mockGeneratePDF).toHaveBeenCalledWith('dispensingReport', expect.any(Object));
        });
    });
});