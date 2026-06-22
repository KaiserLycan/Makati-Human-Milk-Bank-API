import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import AuthRouter from "../routers/auth.routers.js";

dotenv.config();

describe("Auth Router Integration Tests", () => {
    let app;
    let testUser;
    const plaintextPassword = "password123";

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use("/api/auth", AuthRouter);
        app.use(globalErrorHandler);

        const hashedPassword = bcrypt.hashSync(plaintextPassword, 10);
        testUser = await prisma.user.create({
            data: {
                name: "Auth Integration User",
                email: `auth_integration_${Date.now()}@example.com`,
                phone: "+639171234567",
                password: hashedPassword,
                role: "staff",
                status: "active",
            }
        });
    });

    afterAll(async () => {
        if (testUser) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should fail to log in with incorrect credentials", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: "wrongpassword" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should log in successfully and set access_token cookie", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: plaintextPassword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.headers["set-cookie"]).toBeDefined();
        
        const cookie = res.headers["set-cookie"][0];
        expect(cookie).toContain("access_token");
    });
});
