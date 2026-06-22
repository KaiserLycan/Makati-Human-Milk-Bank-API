import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import UserRouter from "../routers/user.routers.js";

dotenv.config();

describe("User API Integration Tests", () => {
    let app;
    let authCookie;
    let testUser;
    let createdUser;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/users", UserRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { role: "manager", status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "User Int Manager",
                    email: `user_int_mgr_${Date.now()}@example.com`,
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
        if (createdUser) {
            try {
                await prisma.user.delete({ where: { user_id: createdUser.user_id } });
            } catch (e) {}
        }
        if (testUser && testUser.email.startsWith("user_int_mgr_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should allow a manager to create a new user", async () => {
        const payload = {
            name: "Newly Created User",
            email: `new_user_${Date.now()}@example.com`,
            phone: "+639171234567",
            password: "password123",
            role: "staff",
            status: "active"
        };

        const res = await request(app)
            .post("/api/users")
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        createdUser = res.body.data;
        expect(createdUser.name).toBe("Newly Created User");
    });

    it("should allow a manager to query list of users", async () => {
        const res = await request(app)
            .get("/api/users")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data).toBeDefined();
    });

    it("should allow a manager to retrieve user details by ID", async () => {
        const res = await request(app)
            .get(`/api/users/${createdUser.user_id}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Newly Created User");
    });

    it("should allow a manager to update a user", async () => {
        const payload = {
            name: "Updated User Name",
            email: createdUser.email,
            phone: "+639171234567",
            role: "staff"
        };

        const res = await request(app)
            .put(`/api/users/${createdUser.user_id}`)
            .set("Cookie", [authCookie])
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Updated User Name");
        createdUser = res.body.data;
    });

    it("should allow a manager to toggle user status", async () => {
        const res = await request(app)
            .patch(`/api/users/status/${createdUser.user_id}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should allow a manager to remove a user", async () => {
        const res = await request(app)
            .delete(`/api/users/${createdUser.user_id}`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        createdUser = null; // Marked deleted
    });
});
