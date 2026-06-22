import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

const mockGetAllocatedRequests = jest.fn((req, res) =>
    res.status(200).json({ success: true, data: [] }),
);
const mockGetAllocatedRequest = jest.fn((req, res) =>
    res.status(200).json({ success: true, data: {} }),
);
const mockDispenseMilk = jest.fn((req, res) => res.status(200).json({ success: true, data: {} }));

jest.mock("../controllers/dispensing.controllers.js", () => ({
    getAllocatedRequests: (req, res) => mockGetAllocatedRequests(req, res),
    getAllocatedRequest: (req, res) => mockGetAllocatedRequest(req, res),
    DispenseMilk: (req, res) => mockDispenseMilk(req, res),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

describe("Dispensing Router", () => {
    let app;

    beforeEach(async () => {
        const dispensingRouter = (await import("../routers/dispensing.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/dispensing", dispensingRouter);
    });

    describe("GET /", () => {
        it("should return the dispensing queue", async () => {
            const response = await request(app).get("/dispensing");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:rid/dispense", () => {
        it("should dispense milk for a valid request", async () => {
            const response = await request(app).patch("/dispensing/1/dispense");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 404 for a non-existent request", async () => {
            mockDispenseMilk.mockImplementationOnce((req, res) => {
                res.status(404).json({ success: false, message: "Not Found" });
            });
            const response = await request(app).patch("/dispensing/999/dispense");
            expect(response.status).toBe(404);
        });
    });
});
