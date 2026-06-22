import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import CollectionRouter from "../routers/collection.routers.js";

dotenv.config();

describe("Collection API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testDonor;
    let testRawMilk;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/collections", CollectionRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Collection Int Manager",
                    email: `coll_int_mgr_${Date.now()}@example.com`,
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

        // Create a test donor so we can log collections
        testDonor = await prisma.donor.create({
            data: {
                name: "Collection Test Donor",
                email: `coll_donor_${Date.now()}@example.com`,
                phone: "+639171234567",
                birth_date: new Date("1995-01-01"),
                profile: {},
                application_status: "approved",
                account_status: "active",
            }
        });
    });

    afterAll(async () => {
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
        if (testUser && testUser.email.startsWith("coll_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully log a collection", async () => {
        const payload = {
            dtn: testDonor.dtn,
            volume_ml: 500,
            expiration_date: new Date("2028-01-01"),
            program: "ST",
            collected_by: testUser.user_id,
            health_center: "Test Health Center"
        };

        const res = await request(app)
            .post("/api/collections")
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        testRawMilk = res.body.data;
        expect(Number(testRawMilk.volume_ml)).toBe(500);
    });

    it("should query collection list", async () => {
        const res = await request(app)
            .get("/api/collections")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should retrieve collection details by CTN", async () => {
        const res = await request(app)
            .get(`/api/collections/${testRawMilk.ctn}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ctn).toBe(testRawMilk.ctn);
    });

    it("should update collection volume and program", async () => {
        const payload = {
            dtn: testDonor.dtn,
            volume_ml: 600,
            program: "ST",
            expiration_date: new Date("2028-01-01"),
            collected_by: testUser.user_id,
            health_center: "Updated Health Center"
        };

        const res = await request(app)
            .put(`/api/collections/${testRawMilk.ctn}`)
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Number(res.body.data.volume_ml)).toBe(600);
        expect(res.body.data.program).toBe("ST");
    });

    it("should update QAT status", async () => {
        const res = await request(app)
            .patch(`/api/collections/${testRawMilk.ctn}/qat-status`)
            .set("Cookie", [authCookie])
            .send({ qat_status: "pass" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should update milk status", async () => {
        const res = await request(app)
            .patch(`/api/collections/${testRawMilk.ctn}/milk-status`)
            .set("Cookie", [authCookie])
            .send({ milk_status: "contaminated" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
