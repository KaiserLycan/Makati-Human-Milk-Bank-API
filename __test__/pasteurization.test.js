import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

jest.mock("../controllers/pasteurization.controllers.js", () => ({
    queryPasteurizedMilkRecords: jest.fn((req, res) =>
        res.status(200).json({ success: true, data: [] }),
    ),
    viewPasteurizedMilk: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    createBatchMilk: jest.fn((req, res) => res.status(201).json({ success: true, data: {} })),
    updatePasteurizedMilk: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    deletePasteurizedMilk: jest.fn((req, res) =>
        res.status(200).json({ success: true, message: "Record deleted" }),
    ),
    updateMBTStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    updateMilkStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

jest.mock("../middleware/validate.js", () => ({
    validateRequest: (schema) => (req, res, next) => next(),
}));

describe("Pasteurization Router", () => {
    let app;

    beforeEach(async () => {
        const pasteurizationRouter = (await import("../routers/pasteurization.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/pasteurization", pasteurizationRouter);
    });

    describe("GET /", () => {
        it("should return a list of pasteurized milk records", async () => {
            const response = await request(app).get("/pasteurization");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /:btl_id", () => {
        it("should return a single pasteurized milk record", async () => {
            const response = await request(app).get("/pasteurization/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("POST /", () => {
        it("should create a new pasteurized milk record", async () => {
            const newRecord = {
                pid: 1,
                batch_number: 1,
                bottle_count: 10,
                volume_per_bottle: 100,
                pasteurization_date: new Date(),
            };
            const response = await request(app).post("/pasteurization").send(newRecord);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:btl_id", () => {
        it("should update a pasteurized milk record", async () => {
            const updatedRecord = { volume_per_bottle: 120 };
            const response = await request(app).patch("/pasteurization/1").send(updatedRecord);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("DELETE /:btl_id", () => {
        it("should delete a pasteurized milk record", async () => {
            const response = await request(app).delete("/pasteurization/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:btl_id/mbt-status", () => {
        it("should update the MBT status of a record", async () => {
            const response = await request(app)
                .patch("/pasteurization/1/mbt-status")
                .send({ mbt_status: "fail" });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:btl_id/milk-status", () => {
        it("should update the milk status of a record", async () => {
            const response = await request(app)
                .patch("/pasteurization/1/milk-status")
                .send({ milk_status: "contaminated" });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
