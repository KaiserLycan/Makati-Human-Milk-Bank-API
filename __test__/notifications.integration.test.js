import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { prisma } from "../library/db/db.ts";
import { globalErrorHandler } from "../middleware/errorHandler.js";
import NotificationRouter from "../routers/notification.routers.js";

dotenv.config();

describe("Notifications API Integration Tests", () => {
    jest.setTimeout(30000);
    let app;
    let authCookie;
    let testUser;
    let testNotification;

    beforeAll(async () => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());
        
        app.use("/api/notifications", NotificationRouter);
        app.use(globalErrorHandler);

        testUser = await prisma.user.findFirst({
            where: { status: "active" }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: "Notification Int User",
                    email: `notif_int_${Date.now()}@example.com`,
                    phone: "+639171234567",
                    password: "password123",
                    role: "staff",
                    status: "active",
                }
            });
        }

        const token = jwt.sign({ user_id: testUser.user_id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h"
        });
        authCookie = `access_token=${token}`;

        // Create a test notification in DB for our user
        testNotification = await prisma.notification.create({
            data: {
                recipient_id: testUser.user_id,
                entity_type: "System",
                entity_id: 1,
                notification_type: "info",
                title: "Test Notification",
                message: "This is a test notification message",
                is_read: false,
            }
        });
    });

    afterAll(async () => {
        if (testNotification) {
            try {
                await prisma.notification.delete({ where: { nid: testNotification.nid } });
            } catch (e) {}
        }
        if (testUser && testUser.email.startsWith("notif_int_")) {
            try {
                await prisma.user.delete({ where: { user_id: testUser.user_id } });
            } catch (e) {}
        }
        await prisma.$disconnect();
    });

    it("should successfully fetch a list of notifications for the authenticated user", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
    });

    it("should successfully mark a notification as read", async () => {
        const res = await request(app)
            .patch(`/api/notifications/${testNotification.nid}/read`)
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should successfully trigger the expiration check job", async () => {
        const res = await request(app)
            .post("/api/notifications/trigger-expiration")
            .set("Cookie", [authCookie]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
