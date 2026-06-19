import { describe, it, expect, jest, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import { APIResponse } from "../library/classes/APIResponse.js";

const mockQueryAuditLogs = jest.fn((req, res) => {
    return res.status(200).json(new APIResponse(200, null, "Query successful"));
});

jest.mock("../controllers/audit.controllers.js", () => ({
    queryAuditLogs: (req, res) => mockQueryAuditLogs(req, res),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

jest.mock("../middleware/authorize.js", () => ({
    authorize: (req, res, next) => next(),
}));

describe("Audit Router", () => {
    let app;

    beforeAll(async () => {
        const auditRouter = (await import("../routers/audit.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/audit", auditRouter);
    });

    describe("GET /", () => {
        it("should return a 200 OK status and the audit logs", async () => {
            const response = await request(app).get("/audit");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should handle query parameters correctly", async () => {
            const response = await request(app).get("/audit?page=2&limit=20");
            expect(response.status).toBe(200);
        });
    });
});
