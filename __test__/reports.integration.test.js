import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import ReportsRouter from "../routers/reports.routers.js";

dotenv.config();

jest.mock("../library/utils/pdfGenerator.js", () => ({
    generatePDF: jest.fn(() => Buffer.from("mocked pdf content")),
}));

describe("Reports API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/reports", ReportsRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Reports Int Manager",
                    email: `rep_int_mgr_${Date.now()}@example.com`,
                    phone: "+639171234567",
                    password: "password123",
                    role: "manager",
                    status: "active",
                }
            });
        }

        const token = jwt.sign({ user_id: testUser.user_id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h"
        });
        authCookie = `access_token=${token}`;
    });

    afterAll(async () => {
        if (testUser && testUser.email.startsWith("rep_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully export collection report as PDF", async () => {
        const res = await request(app)
            .get("/api/reports/collection/export?range=month")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.header["content-type"]).toBe("application/pdf");
    });
});
