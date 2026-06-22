import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import PasteurizationRouter from "../routers/pasteurization.routers.js";

dotenv.config();

describe("Pasteurization API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testDonor;
    let testRawMilk;
    let testPool;
    let testBottles = [];

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/pasteurization", PasteurizationRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Pasteurization Int Manager",
                    email: `past_int_mgr_${Date.now()}@example.com`,
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
                name: "Past Test Donor",
                email: `past_donor_${Date.now()}@example.com`,
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

        testPool = await prisma.pool_milk.create({
            data: {
                expected_volume_ml: 500,
                actual_volume_ml: 400,
                remaining_volume_ml: 400,
                pooled_by: testUser.user_id,
                modified_by: testUser.user_id,
                expiration_date: new Date("2028-01-01"),
                milk_status: "good",
            }
        });
    });

    afterAll(async () => {
        for (const b of testBottles) {
            try {
                await prisma.pasteurized_milk.delete({ where: { btl_id: b.btl_id } });
            } catch (e) {}
        }
        if (testPool) {
            try {
                await prisma.batch_milk.deleteMany({ where: { source: testPool.pid } });
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
        if (testUser && testUser.email.startsWith("past_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully create a pasteurized batch and decrement remaining_volume_ml", async () => {
        const payload = {
            pid: testPool.pid,
            bottle_count: 3,
            bottle_type: "ameda",
            volume_per_bottle: 100,
            pasteurization_date: new Date(),
        };

        const res = await request(app)
            .post("/api/pasteurization")
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(3);
        testBottles = res.body.data;

        const poolCheck = await prisma.pool_milk.findUnique({
            where: { pid: testPool.pid }
        });
        expect(Number(poolCheck.remaining_volume_ml)).toBe(100);
    });

    it("should retrieve pasteurization records list", async () => {
        const res = await request(app)
            .get("/api/pasteurization")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should retrieve specific pasteurized bottle details by ID", async () => {
        const bottleToGet = testBottles[0];
        const res = await request(app)
            .get(`/api/pasteurization/${bottleToGet.btl_id}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.btl_id).toBe(bottleToGet.btl_id);
    });

    it("should adjust pool remaining volume when updating bottle volume", async () => {
        const bottleToUpdate = testBottles[0];
        const payload = {
            volume_per_bottle: 150
        };

        const res = await request(app)
            .patch(`/api/pasteurization/${bottleToUpdate.btl_id}`)
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const poolCheck = await prisma.pool_milk.findUnique({
            where: { pid: testPool.pid }
        });
        expect(Number(poolCheck.remaining_volume_ml)).toBe(50);
    });

    it("should allow updating MBT status", async () => {
        const bottleToUpdate = testBottles[0];
        const res = await request(app)
            .patch(`/api/pasteurization/${bottleToUpdate.btl_id}/mbt-status`)
            .set("Cookie", [authCookie])
            .send({ mbt_status: "pass" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should allow updating milk status", async () => {
        const bottleToUpdate = testBottles[0];
        const res = await request(app)
            .patch(`/api/pasteurization/${bottleToUpdate.btl_id}/milk-status`)
            .set("Cookie", [authCookie])
            .send({ milk_status: "contaminated" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should restore volume to the pool when deleting a bottle", async () => {
        const bottleToDelete = testBottles[0];

        const res = await request(app)
            .delete(`/api/pasteurization/${bottleToDelete.btl_id}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const poolCheck = await prisma.pool_milk.findUnique({
            where: { pid: testPool.pid }
        });
        expect(Number(poolCheck.remaining_volume_ml)).toBe(200); // 50 + 150 returned
    });
});
