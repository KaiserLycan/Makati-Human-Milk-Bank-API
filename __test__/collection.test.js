import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

jest.mock("../controllers/collection.controllers.js", () => ({
    queryCollections: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    viewCollection: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    logCollection: jest.fn((req, res) => res.status(201).json({ success: true, data: {} })),
    updateCollection: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    deleteCollection: jest.fn((req, res) =>
        res.status(200).json({ success: true, message: "Collection deleted" }),
    ),
    updateMilkStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    updateQATStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

jest.mock("../middleware/validate.js", () => ({
    validateRequest: (schema) => (req, res, next) => next(),
}));

describe("Collection Router", () => {
    let app;

    beforeEach(async () => {
        const collectionRouter = (await import("../routers/collection.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/collections", collectionRouter);
    });

    describe("GET /", () => {
        it("should return a list of collections", async () => {
            const response = await request(app).get("/collections");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /:ctn", () => {
        it("should return a single collection", async () => {
            const response = await request(app).get("/collections/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("POST /", () => {
        it("should create a new collection", async () => {
            const newCollection = {
                dtn: 1,
                volume_ml: 100,
                program: "ST",
                health_center: "Test Center",
                expiration_date: new Date(),
                collected_by: "test-user",
            };
            const response = await request(app).post("/collections").send(newCollection);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PUT /:ctn", () => {
        it("should update a collection", async () => {
            const updatedCollection = { volume_ml: 120 };
            const response = await request(app).put("/collections/1").send(updatedCollection);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("DELETE /:ctn", () => {
        it("should delete a collection", async () => {
            const response = await request(app).delete("/collections/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:ctn/milk-status", () => {
        it("should update the milk status of a collection", async () => {
            const response = await request(app)
                .patch("/collections/1/milk-status")
                .send({ milk_status: "contaminated" });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:ctn/qat-status", () => {
        it("should update the QAT status of a collection", async () => {
            const response = await request(app)
                .patch("/collections/1/qat-status")
                .send({ qat_status: "fail" });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
