import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

jest.mock("../controllers/beneficiary.controllers.js", () => ({
    queryBeneficiaries: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
    viewBeneficiaryProfile: jest.fn((req, res) =>
        res.status(200).json({ success: true, data: {} }),
    ),
    registerBeneficiary: jest.fn((req, res) => res.status(201).json({ success: true, data: {} })),
    updateBeneficiaryInformation: jest.fn((req, res) =>
        res.status(200).json({ success: true, data: {} }),
    ),
    approveBeneficiary: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    rejectBeneficiary: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    revertBeneficiary: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    toggleBeneficiaryStatus: jest.fn((req, res) =>
        res.status(200).json({ success: true, data: {} }),
    ),
    removeBeneficiary: jest.fn((req, res) =>
        res.status(200).json({ success: true, message: "Beneficiary deleted" }),
    ),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

jest.mock("../middleware/authorize.js", () => ({
    authorize: (_roles) => (req, res, next) => next(),
}));

jest.mock("../middleware/upload.js", () => ({
    uploadBeneficiaryProfile: (req, res, next) => next(),
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

describe("Beneficiary Router", () => {
    let app;

    beforeEach(async () => {
        const beneficiaryRouter = (await import("../routers/beneficiary.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/beneficiaries", beneficiaryRouter);
    });

    describe("GET /", () => {
        it("should return a list of beneficiaries", async () => {
            const response = await request(app).get("/beneficiaries");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /:bid", () => {
        it("should return a single beneficiary", async () => {
            const response = await request(app).get("/beneficiaries/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("POST /register", () => {
        it("should create a new beneficiary", async () => {
            const newBeneficiary = { name: "John Doe", caregiver: "Jane Doe" };
            const response = await request(app)
                .post("/beneficiaries/register")
                .send(newBeneficiary);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe("POST /public-register", () => {
        it("should create a new beneficiary from a public endpoint", async () => {
            const newBeneficiary = { name: "John Doe", caregiver: "Jane Doe" };
            const response = await request(app)
                .post("/beneficiaries/public-register")
                .send(newBeneficiary);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PUT /:bid", () => {
        it("should update a beneficiary", async () => {
            const updatedBeneficiary = { name: "John Doe Updated" };
            const response = await request(app).put("/beneficiaries/1").send(updatedBeneficiary);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /approve/:bid", () => {
        it("should approve a beneficiary", async () => {
            const response = await request(app).patch("/beneficiaries/approve/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /reject/:bid", () => {
        it("should reject a beneficiary", async () => {
            const response = await request(app).patch("/beneficiaries/reject/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /toggle-status/:bid", () => {
        it("should toggle the status of a beneficiary", async () => {
            const response = await request(app).patch("/beneficiaries/toggle-status/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("DELETE /:bid", () => {
        it("should delete a beneficiary", async () => {
            const response = await request(app).delete("/beneficiaries/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /revert/:bid", () => {
        it("should revert a beneficiary application to pending", async () => {
            const response = await request(app).patch("/beneficiaries/revert/1");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
