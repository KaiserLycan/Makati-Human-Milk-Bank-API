import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";


// ==========================================
// 1. SETUP ALL MOCKS FIRST
// ==========================================


// A. Mock Prisma
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockCreate = jest.fn();


jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        raw_milk: {
            findMany: (...args) => mockFindMany(...args),
            updateMany: (...args) => mockUpdateMany(...args)
        },
        pool_milk: {
            findUnique: (...args) => mockFindUnique(...args),
            update: (...args) => mockUpdate(...args),
            create: (...args) => mockCreate(...args)
        },
        $transaction: jest.fn(async (callback) => {
            const fakeTx = {
                pool_milk: { create: (...args) => mockCreate(...args) },
                raw_milk: { updateMany: (...args) => mockUpdateMany(...args) }
            };
            return callback(fakeTx);
        }),
    }
}));


// B. Mock Auth Middleware (Instantly log us in)
jest.mock("../middleware/auth.middleware.js", () => ({
    __esModule: true,
    ProtectRoute: (req, res, next) => {
        req.user = { user_id: 1, role: "staff" };
        next();
    }
}));


jest.mock("../middleware/authorize.middleware.js", () => ({
    __esModule: true,
    Authorize: (req, res, next) => next()
}));






// ==========================================
// 2. CREATE STANDALONE EXPRESS APP
// ==========================================
import PoolingRouter from "../routes/pooling.router.js";


const app = express();
app.use(express.json()); // Essential for parsing req.body
app.use("/api/pooling", PoolingRouter);




// ==========================================
// 3. THE TESTS
// ==========================================
describe("Processing Pipeline: Pooling Endpoints", () => {
   
    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe("POST /api/pooling/create", () => {


        it("1. Should return 400 Bad Request if validation fails (The Bouncer)", async () => {
            const response = await request(app)
                .post("/api/pooling/create")
                .send({
                    raw_milk_ctns: ["bad", "data"], // Triggers our mocked Bouncer
                    actual_volume_ml: -50
                });


            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
        });


        it("2. Should return 400 if attempting to pool milk that failed QAT (Requirement R40)", async () => {
            // Fake a database response where the milk failed QAT
            mockFindMany.mockResolvedValue([
                { ctn: 999, qat_status: 'fail', pid: null, milk_status: 'stored', volume_ml: 100 }
            ]);


            const response = await request(app)
                .post("/api/pooling/create")
                .send({ raw_milk_ctns: [999] });


            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Only 'pass' is allowed");
        });


        it("3. Should successfully create a milk pool (Requirement R41)", async () => {
            // Fake perfect raw milk records
            mockFindMany.mockResolvedValue([
                { ctn: 1, qat_status: 'pass', pid: null, milk_status: 'stored', volume_ml: 100 },
                { ctn: 2, qat_status: 'pass', pid: null, milk_status: 'stored', volume_ml: 150 }
            ]);


            // Fake the transaction creation
            mockCreate.mockResolvedValue({ pid: 1, qat_status: 'pending', milk_status: 'pooled' });


            const response = await request(app)
                .post("/api/pooling/create")
                .send({
                    raw_milk_ctns: [1, 2],
                    remarks: "Automated Jest Test Pool"
                });


            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Milk pooled successfully.");      
            expect(response.body.data.qat_status).toBe("pending");
        });
    });


    describe("PATCH /api/pooling/:pid/qat", () => {
       
        it("4. Should auto-discard the pool if it fails QAT (Requirement R44)", async () => {
            // Fake finding the pool
            mockFindUnique.mockResolvedValue({ pid: 1, milk_status: 'pooled', remarks: '' });
           
            // Fake the update
            mockUpdate.mockResolvedValue({ pid: 1, qat_status: 'fail', milk_status: 'discarded' });


            const response = await request(app)
                .patch("/api/pooling/1/qat")
                .send({
                    qat_status: "fail",
                    remarks: "Failed lab test"
                });


            expect(response.status).toBe(200);
            expect(response.body.data.qat_status).toBe("fail");
            expect(response.body.data.milk_status).toBe("discarded"); // R44 Check
        });


    });
});

