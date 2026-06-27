import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

jest.mock("../controllers/donor.controllers.js", () => ({
    queryDonors: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    viewDonorProfile: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    registerDonor: jest.fn((req, res) => res.status(201).json({ success: true, data: {} })),
    updateDonorInformation: jest.fn((req, res) =>
        res.status(200).json({ success: true, data: {} }),
    ),
    approveDonor: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    rejectDonor: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    revertDonor: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    toggleDonorStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    removeDonor: jest.fn((req, res) =>
        res.status(200).json({ success: true, message: "Donor deleted" }),
    ),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

jest.mock("../middleware/authorize.js", () => ({
    authorize: (_roles) => (req, res, next) => next(),
}));

jest.mock("../middleware/upload.js", () => ({
    uploadSingleImage: (req, res, next) => next(),
}));

jest.mock("../middleware/parseFormatData.js", () => ({
    parseFormDataJson: (req, res, next) => next(),
}));

jest.mock("../middleware/validate.js", () => ({
    validateRequest: (_schema) => (req, res, next) => next(),
}));

jest.mock("../middleware/rateLimiter.js", () => ({
    strictLimiter: (req, res, next) => next(),
}));

describe("Donor Router", () => {
    let app;

    beforeEach(async () => {
        const donorRouter = (await import("../routers/donor.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/donors", donorRouter);
    });

    describe("GET /", () => {
        it("should return a list of donors", async () => {
            const response = await request(app).get("/donors");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /:dtn", () => {
        it("should return a single donor", async () => {
            const response = await request(app).get("/donors/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("POST /register", () => {
        it("should create a new donor", async () => {
            const newDonor = {
                name: "Jane Doe",
                email: "jane@example.com",
                phone: "+12345678901",
                birth_date: "2000-01-01",
            };
            const response = await request(app).post("/donors/register").send(newDonor);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe("POST /public-register", () => {
        it("should create a new donor from a public endpoint", async () => {
            const newDonor = {
                name: "Jane Doe",
                email: "jane@example.com",
                phone: "+12345678901",
                birth_date: "2000-01-01",
            };
            const response = await request(app).post("/donors/public-register").send(newDonor);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PUT /:dtn", () => {
        it("should update a donor", async () => {
            const updatedDonor = { name: "Jane Doe Updated" };
            const response = await request(app).put("/donors/1").send(updatedDonor);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /approve/:dtn", () => {
        it("should approve a donor", async () => {
            const response = await request(app).patch("/donors/approve/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /reject/:dtn", () => {
        it("should reject a donor", async () => {
            const response = await request(app).patch("/donors/reject/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /toggle-status/:dtn", () => {
        it("should toggle the status of a donor", async () => {
            const response = await request(app).patch("/donors/toggle-status/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("DELETE /:dtn", () => {
        it("should delete a donor", async () => {
            const response = await request(app).delete("/donors/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /revert/:dtn", () => {
        it("should revert a donor application to pending", async () => {
            const response = await request(app).patch("/donors/revert/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
