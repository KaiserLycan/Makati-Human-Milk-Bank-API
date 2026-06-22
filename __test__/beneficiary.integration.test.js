import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import BeneficiaryRouter from "../routers/beneficiary.routers.js";

dotenv.config();

describe("Beneficiary API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testBeneficiary;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/beneficiaries", BeneficiaryRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Beneficiary Int Manager",
                    email: `bene_int_mgr_${Date.now()}@example.com`,
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
        if (testBeneficiary) {
            try {
                await prisma.beneficiary.delete({ where: { bid: testBeneficiary.bid } });
            } catch (e) {}
        }
        if (testUser && testUser.email.startsWith("bene_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully register a beneficiary with standard fields", async () => {
        const payload = {
            name: "Integration Test Beneficiary",
            caregiver: "Jane Caregiver",
            caregiver_email: `int_caregiver_${Date.now()}@example.com`,
            caregiver_phone: "+639171234567",
            birth_date: "2025-12-01",
            weight_kg: 4.2,
            feeding_requirement_ml: 150,
            profile: {
                profile_image_url: "http://example.com/image.jpg",
                prescription_details: "http://example.com/presc.jpg",
                clinical_abstract: "http://example.com/abstract.jpg"
            }
        };

        const res = await request(app)
            .post("/api/beneficiaries/public-register")
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        testBeneficiary = res.body.data;
        expect(testBeneficiary.name).toBe("Integration Test Beneficiary");
    });

    it("should allow a manager to query list of beneficiaries", async () => {
        const res = await request(app)
            .get("/api/beneficiaries")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should allow a manager to get beneficiary details by ID", async () => {
        const res = await request(app)
            .get(`/api/beneficiaries/${testBeneficiary.bid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Integration Test Beneficiary");
    });

    it("should allow a manager to update a beneficiary profile", async () => {
        const payload = {
            name: "Updated Integration Test Beneficiary",
            caregiver: "Jane Caregiver",
            caregiver_email: testBeneficiary.caregiver_email,
            caregiver_phone: "+639171234567",
            birth_date: "2025-12-01",
            weight_kg: 4.6,
            feeding_requirement_ml: 180,
            profile: testBeneficiary.profile,
        };

        const res = await request(app)
            .put(`/api/beneficiaries/${testBeneficiary.bid}`)
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Number(res.body.data.weight_kg)).toBe(4.6);
        expect(Number(res.body.data.feeding_requirement_ml)).toBe(180);
        testBeneficiary = res.body.data;
    });

    it("should allow a manager to approve the beneficiary", async () => {
        const res = await request(app)
            .patch(`/api/beneficiaries/approve/${testBeneficiary.bid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should allow a manager to toggle beneficiary status", async () => {
        const res = await request(app)
            .patch(`/api/beneficiaries/toggle-status/${testBeneficiary.bid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
