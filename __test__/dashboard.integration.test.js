import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import DashboardRouter from "../routers/dashboard.routers.js";

dotenv.config();

describe("Dashboard API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/dashboard", DashboardRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Dashboard Int User",
                    email: `dash_int_${Date.now()}@example.com`,
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
        if (testUser && testUser.email.startsWith("dash_int_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully fetch dashboard summary metrics", async () => {
        const res = await request(app)
            .get("/api/dashboard/summary?range=week")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
    });

    it("should successfully fetch dashboard trends metrics", async () => {
        const res = await request(app)
            .get("/api/dashboard/trends?range=week")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
    });
});
