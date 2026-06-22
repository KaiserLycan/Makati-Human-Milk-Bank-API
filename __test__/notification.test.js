import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

const mockGetNotifications = jest.fn((req, res) =>
    res.status(200).json({ success: true, data: [] }),
);
const mockMarkNotificationRead = jest.fn((req, res) =>
    res.status(200).json({ success: true, message: "Notification marked as read." }),
);
const mockTriggerExpiration = jest.fn((req, res) =>
    res.status(200).json({ success: true, message: "Expiration check triggered" }),
);

jest.mock("../controllers/notification.controllers.js", () => ({
    getNotifications: (req, res) => mockGetNotifications(req, res),
    readNotification: (req, res) => mockMarkNotificationRead(req, res),
    triggerExpirationCheck: (req, res) => mockTriggerExpiration(req, res),
}));

jest.mock("../services/expiration.services.js");
jest.mock("../services/audit.services.js", () => ({
    subToAuditLogs: jest.fn(),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => {
        req.user = { user_id: "test-user", role: "staff" };
        next();
    },
}));

describe("Notification Router", () => {
    let app;

    beforeEach(async () => {
        const notificationRouter = (await import("../routers/notification.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/notifications", notificationRouter);
    });

    describe("GET /", () => {
        it("should return a user's notifications", async () => {
            const response = await request(app).get("/notifications");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("PATCH /:nid/read", () => {
        it("should mark a notification as read", async () => {
            const response = await request(app).patch("/notifications/1/read");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 404 for a non-existent notification", async () => {
            mockMarkNotificationRead.mockImplementationOnce((req, res) => {
                res.status(404).json({ success: false, message: "Not Found" });
            });
            const response = await request(app).patch("/notifications/999/read");
            expect(response.status).toBe(404);
        });
    });

    describe("POST /trigger-expiration", () => {
        it("should trigger the expiration job", async () => {
            const response = await request(app).post("/notifications/trigger-expiration");
            expect(response.status).toBe(200);
        });

        it("should handle errors during expiration check", async () => {
            mockTriggerExpiration.mockImplementationOnce(() => {
                throw new Error("Test Error");
            });
            const response = await request(app).post("/notifications/trigger-expiration");
            expect(response.status).toBe(500);
        });
    });
});
