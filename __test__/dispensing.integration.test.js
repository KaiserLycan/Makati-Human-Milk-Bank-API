import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import DispensingRouter from "../routers/dispensing.routers.js";

dotenv.config();

describe("Dispensing API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testBeneficiary;
    let testDonor;
    let testRawMilk;
    let testPool;
    let testBatch;
    let testBottle;
    let testRequest;
    let testRequestBottle;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/dispensing", DispensingRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Dispensing Int Manager",
                    email: `disp_int_mgr_${Date.now()}@example.com`,
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

        // Create Beneficiary
        testBeneficiary = await prisma.beneficiary.create({
            data: {
                name: "Dispense Test Beneficiary",
                caregiver: "Jane Caregiver",
                caregiver_email: `disp_caregiver_${Date.now()}@example.com`,
                caregiver_phone: "+639171234567",
                birth_date: new Date("2025-12-01"),
                weight_kg: 4.5,
                feeding_requirement_ml: 120,
                profile: {},
                application_status: "approved",
                account_status: "active",
            }
        });

        // Create Donor
        testDonor = await prisma.donor.create({
            data: {
                name: "Dispense Test Donor",
                email: `disp_donor_${Date.now()}@example.com`,
                phone: "+639171234567",
                birth_date: new Date("1995-01-01"),
                profile: {},
                application_status: "approved",
                account_status: "active",
            }
        });

        // Create Raw Milk
        testRawMilk = await prisma.raw_milk.create({
            data: {
                dtn: testDonor.dtn,
                volume_ml: 500,
                expiration_date: new Date("2028-01-01"),
                qat_status: "pass",
                milk_status: "good",
            }
        });

        // Create Pool
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

        // Create Batch
        testBatch = await prisma.batch_milk.create({
            data: {
                processed_date: new Date(),
                processed_by: testUser.user_id,
                source: testPool.pid,
                bottle_count: 1,
            }
        });

        // Create Bottle
        testBottle = await prisma.pasteurized_milk.create({
            data: {
                batch_number: testBatch.batch_id,
                bottle_sequence_number: 1,
                volume_ml: 100,
                bottle: "ameda",
                expiration_date: new Date("2028-01-01"),
                mbt_status: "pass",
                dispense_status: "available",
                milk_status: "good",
            }
        });

        // Create Request (allocated status)
        testRequest = await prisma.request.create({
            data: {
                bid: testBeneficiary.bid,
                requested_vol_ml: 100,
                hospital: "Test General Hospital",
                request_status: "allocated",
                modified_by: testUser.user_id,
            }
        });

        // Link request and bottle
        testRequestBottle = await prisma.request_bottles.create({
            data: {
                rid: testRequest.rid,
                btl_id: testBottle.btl_id,
            }
        });
    });

    afterAll(async () => {
        if (testRequestBottle) {
            try {
                await prisma.request_bottles.delete({
                    where: {
                        rid_btl_id: { rid: testRequest.rid, btl_id: testBottle.btl_id }
                    }
                });
            } catch (e) {}
        }
        if (testRequest) {
            try {
                await prisma.request.delete({ where: { rid: testRequest.rid } });
            } catch (e) {}
        }
        if (testBottle) {
            try {
                await prisma.pasteurized_milk.delete({ where: { btl_id: testBottle.btl_id } });
            } catch (e) {}
        }
        if (testBatch) {
            try {
                await prisma.batch_milk.delete({ where: { batch_id: testBatch.batch_id } });
            } catch (e) {}
        }
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
        if (testBeneficiary) {
            try {
                await prisma.beneficiary.delete({ where: { bid: testBeneficiary.bid } });
            } catch (e) {}
        }
        if (testUser && testUser.email.startsWith("disp_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should fetch the dispensing queue (allocated requests)", async () => {
        const res = await request(app)
            .get("/api/dispensing")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
        // Since we created one request in allocated state, it should be in the queue
        const found = res.body.data.data.find(r => r.rid === testRequest.rid);
        expect(found).toBeDefined();
    });

    it("should fetch specific allocated request details", async () => {
        const res = await request(app)
            .get(`/api/dispensing/${testRequest.rid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.rid).toBe(testRequest.rid);
    });

    it("should dispense milk and mark request as completed", async () => {
        const res = await request(app)
            .patch(`/api/dispensing/${testRequest.rid}/dispense`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.request_status).toBe("completed");

        const updatedBottle = await prisma.pasteurized_milk.findUnique({
            where: { btl_id: testBottle.btl_id }
        });
        expect(updatedBottle.dispense_status).toBe("dispensed");
    });
});
