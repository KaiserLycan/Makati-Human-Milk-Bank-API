import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import DonorRouter from "../routers/donor.routers.js";

dotenv.config();

describe("Donor API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let testDonor;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/donors", DonorRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Donor Int Manager",
                    email: `donor_int_mgr_${Date.now()}@example.com`,
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
        if (testDonor) {
            try {
                await prisma.donor.delete({ where: { dtn: testDonor.dtn } });
            } catch (e) {}
        }
        if (testUser && testUser.email.startsWith("donor_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully register a donor via public-register", async () => {
        const payload = {
            name: "Integration Test Donor",
            email: `int_donor_${Date.now()}@example.com`,
            phone: "+639171234567",
            birth_date: "1990-01-01",
            profile: {
                personal_information: {
                    occupation: "Software Engineer",
                    marital_status: "Single",
                    home_address: "123 Main St, City, Country"
                },
                traveling_information: {
                    travelled_recently: "no"
                },
                donation_information: {
                    reason: "Want to help others",
                    spouse_consent: "no",
                    previously_donated: "no"
                },
                medical_information: {
                    infectious_medical_illness: {
                        tuberculosis: "no",
                        hepatitis_b: "no",
                        mastitis: "no",
                        syphilis: "no",
                        herpes: "no",
                        std: "no"
                    },
                    substance_user_habits: {
                        consumed_alcohol: "no",
                        smoke: "no",
                        illegal_drugs: "no",
                        intravenous_drug_use: "no"
                    },
                    diet_supplement_tracking: {
                        vegetarian: "no",
                        multivitamins: "no",
                        herbal_drugs: "no"
                    },
                    blood_exposure_transfusion: {
                        received_blood: "no",
                        needle_contact: "no",
                        repeated_blood_transfusion: "no"
                    },
                    surgical_specialized_medical_history: {
                        hormone_control: "no",
                        breast_surgery: "no",
                        breast_implant: "no"
                    },
                    exposure_behavior: {
                        tattoos: "no",
                        polygamy: "no",
                        std: "no"
                    }
                }
            }
        };

        const res = await request(app)
            .post("/api/donors/public-register")
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        testDonor = res.body.data;
        expect(testDonor.name).toBe("Integration Test Donor");
    });

    it("should allow a manager to query list of donors", async () => {
        const res = await request(app)
            .get("/api/donors")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should allow a manager to get donor details by DTN", async () => {
        const res = await request(app)
            .get(`/api/donors/${testDonor.dtn}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Integration Test Donor");
    });

    it("should allow a manager to update a donor profile", async () => {
        const payload = {
            name: "Updated Integration Test Donor",
            email: testDonor.email,
            phone: "+639171234567",
            birth_date: "1990-01-01",
            profile: testDonor.profile,
        };

        const res = await request(app)
            .put(`/api/donors/${testDonor.dtn}`)
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Updated Integration Test Donor");
        testDonor = res.body.data;
    });

    it("should allow a manager to approve a donor", async () => {
        const res = await request(app)
            .patch(`/api/donors/approve/${testDonor.dtn}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should allow a manager to toggle donor status", async () => {
        const res = await request(app)
            .patch(`/api/donors/toggle-status/${testDonor.dtn}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
