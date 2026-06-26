import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import ReservationRouter from "../routers/reservation.routers.js";

dotenv.config();

describe("Reservation API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testBeneficiary;
    let testRequest;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/reservations", ReservationRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" },
        });

        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Reservation Int Manager",
                    email: `res_int_mgr_${Date.now()}@example.com`,
                    phone: "+639171234567",
                    password: "password123",
                    role: "manager",
                    status: "active",
                },
            });
        }

        const token = jwt.sign({ user_id: testUser.user_id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h",
        });
        authCookie = `access_token=${token}`;

        // Create an approved, active beneficiary
        testBeneficiary = await prisma.beneficiary.create({
            data: {
                name: "Reservation Test Beneficiary",
                caregiver: "Jane Caregiver",
                caregiver_email: `res_caregiver_${Date.now()}@example.com`,
                caregiver_phone: "+639171234567",
                birth_date: new Date("2025-12-01"),
                weight_kg: 4.5,
                feeding_requirement_ml: 120,
                profile: {},
                application_status: "approved",
                account_status: "active",
                modified_by: testUser.user_id,
            },
        });
    });

    afterAll(async () => {
        if (testRequest) {
            try {
                await prisma.request.delete({ where: { rid: testRequest.rid } });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        if (testBeneficiary) {
            try {
                await prisma.beneficiary.delete({ where: { bid: testBeneficiary.bid } });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        if (testUser && testUser.email.startsWith("res_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        await prisma.$disconnect();
    });

    it("should successfully create a reservation request (Tests DECIMAL(7,2) limit > 99.99)", async () => {
        const payload = {
            bid: testBeneficiary.bid,
            requested_vol_ml: 150.5, // Proves the numeric field overflow bug is fixed
            hospital: "Test General Hospital",
        };

        const res = await request(app)
            .post("/api/reservations")
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        testRequest = res.body.data;
        expect(Number(testRequest.requested_vol_ml)).toBe(150.5);
    });

    it("should reject a new request if the beneficiary already has an active one (Ghost Request fix)", async () => {
        const payload = {
            bid: testBeneficiary.bid,
            requested_vol_ml: 200,
            hospital: "Second Hospital",
        };

        const res = await request(app)
            .post("/api/reservations")
            .set("Cookie", [authCookie])
            .send(payload);

        // Expecting a 400 Bad Request due to the active request duplicate check
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("already has an active (waiting or allocated) request");
    });

    it("should query reservation requests", async () => {
        const res = await request(app).get("/api/reservations").set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should retrieve specific reservation request details by ID", async () => {
        const res = await request(app)
            .get(`/api/reservations/${testRequest.rid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.rid).toBe(testRequest.rid);
    });

    it("should successfully update a waiting reservation request", async () => {
        const payload = {
            requested_vol_ml: 250.5, // Added a decimal just in case Prisma is being hyper-strict
            hospital: "Updated Hospital Name",
        };

        const res = await request(app)
            .put(`/api/reservations/${testRequest.rid}`)
            .set("Cookie", [authCookie])
            .send(payload);

        // --- DIAGNOSTIC LOG ---
        if (res.status !== 200) {
            console.log("UPDATE TEST FAILED. Backend says:", res.body);
        }
        // ----------------------

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Number(res.body.data.requested_vol_ml)).toBe(250.5);
        expect(res.body.data.hospital).toBe("Updated Hospital Name");
    });

    it("should successfully cancel a reservation request", async () => {
        const res = await request(app)
            .patch(`/api/reservations/${testRequest.rid}/cancel`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.request_status).toBe("canceled");
    });

    it("should reject updates to a non-waiting reservation request", async () => {
        const payload = {
            requested_vol_ml: 300,
        };

        const res = await request(app)
            .put(`/api/reservations/${testRequest.rid}`)
            .set("Cookie", [authCookie])
            .send(payload);

        // Expecting a 400 Bad Request because the status is now 'canceled'
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("only edit requests that are currently waiting");
    });

    it("should permanently delete a reservation request", async () => {
        const res = await request(app)
            .delete(`/api/reservations/${testRequest.rid}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Request permanently deleted");
    });
});
