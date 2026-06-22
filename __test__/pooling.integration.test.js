import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import PoolingRouter from "../routers/pooling.routers.js";

dotenv.config();

describe("Pooling API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testDonor;
    let testRawMilk;
    let testPool;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/pooling", PoolingRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Pooling Int Manager",
                    email: `pool_int_mgr_${Date.now()}@example.com`,
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

        testDonor = await prisma.donor.create({
            data: {
                name: "Pooling Test Donor",
                email: `pool_donor_${Date.now()}@example.com`,
                phone: "+639171234567",
                birth_date: new Date("1995-01-01"),
                profile: {},
                application_status: "approved",
                account_status: "active",
            }
        });

        testRawMilk = await prisma.raw_milk.create({
            data: {
                dtn: testDonor.dtn,
                volume_ml: 500,
                expiration_date: new Date("2028-01-01"),
                qat_status: "pass",
                milk_status: "good",
            }
        });
    });

    afterAll(async () => {
        if (testPool) {
            try {
                await prisma.pool_milk.delete({ where: { pid: testPool.pid } });
            } catch (e) {}
        }
        if (testRawMilk) {
            try {
                await prisma.raw_milk.delete({ where: { ctn: testRawMilk.ctn } });
            } catch (e) {}
        }
        if (testDonor) {
            try {
                await prisma.donor.delete({ where: { dtn: testDonor.dtn } });
            } catch (e) {}
        }
        if (testUser && testUser.email.startsWith("pool_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully create a pool and initialize remaining_volume_ml", async () => {
        const payload = {
            collections: [testRawMilk.ctn],
            actual_volume_ml: 450,
            remarks: "Pooling integration test pool"
        };

        const res = await request(app)
            .post("/api/pooling")
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        testPool = res.body.data;
        expect(Number(testPool.actual_volume_ml)).toBe(450);
        expect(Number(testPool.remaining_volume_ml)).toBe(450);
    });

    it("should query milk pools", async () => {
        const res = await request(app)
            .get("/api/pooling")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should retrieve specific milk pool by ID", async () => {
        const res = await request(app)
            .get(`/api/pooling/${testPool.pid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pid).toBe(testPool.pid);
    });

    it("should update pool status", async () => {
        const res = await request(app)
            .patch(`/api/pooling/${testPool.pid}/milk-status`)
            .set("Cookie", [authCookie])
            .send({ milk_status: "contaminated" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
