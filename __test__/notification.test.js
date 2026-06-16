import request from "supertest";
import express from "express";
import { prisma } from "../lib/db/db.ts";

// Mock prisma
jest.mock("../lib/db/db.ts", () => ({
    prisma: {
        notification: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));

// Mock the ProtectRoute middleware
jest.mock("../src/middleware/protectRoute.js", () => ({
    ProtectRoute: (req, res, next) => {
        req.user = { user_id: "test-user-id" };
        next();
    },
}));

describe("Notification System", () => {
    let NotificationRouter;

    beforeAll(() => {
        NotificationRouter = require("../src/v2/notifications/notification.router.js").default;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/notifications", () => {
        it("Should retrieve all unread notifications for staff", async () => {
            const app = express();
            app.use(express.json());
            app.use("/api/notifications", NotificationRouter);

            const mockNotifications = [
                {
                    nid: 1,
                    recipient_id: "test-user-id",
                    entity_type: "donor",
                    notification_type: "new_application",
                    title: "New donor Application",
                    is_read: false,
                    created_at: new Date().toISOString(),
                },
            ];

            prisma.notification.findMany.mockResolvedValue(mockNotifications);

            const response = await request(app).get("/api/notifications?is_read=false").expect(200);

            expect(response.body).toEqual(mockNotifications);
        });

        it("Should filter notifications by read status", async () => {
            const app = express();
            app.use(express.json());
            app.use("/api/notifications", NotificationRouter);

            prisma.notification.findMany.mockResolvedValue([]);

            await request(app).get("/api/notifications?is_read=true").expect(200);

            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    is_read: true,
                }),
                orderBy: { created_at: "desc" },
            });
        });

        it("Should retrieve all notifications without filter", async () => {
            const app = express();
            app.use(express.json());
            app.use("/api/notifications", NotificationRouter);

            prisma.notification.findMany.mockResolvedValue([]);

            await request(app).get("/api/notifications").expect(200);
        });
    });

    describe("PATCH /api/notifications/:nid/read", () => {
        it("Should mark notification as read", async () => {
            const app = express();
            app.use(express.json());
            app.use("/api/notifications", NotificationRouter);

            const updatedNotification = {
                nid: 1,
                recipient_id: "test-user-id",
                is_read: true,
                read_at: new Date(),
            };

            prisma.notification.update.mockResolvedValue(updatedNotification);

            const response = await request(app).patch("/api/notifications/1/read").expect(200);

            expect(response.body.is_read).toBe(true);
        });

        it("Should return 404 if notification not found", async () => {
            const app = express();
            app.use(express.json());
            app.use("/api/notifications", NotificationRouter);

            prisma.notification.update.mockRejectedValue({ code: "P2025" });

            await request(app).patch("/api/notifications/999/read").expect(404);
        });

        it("Should return 500 on database error", async () => {
            const app = express();
            app.use(express.json());
            app.use("/api/notifications", NotificationRouter);

            prisma.notification.update.mockRejectedValue(new Error("DB Error"));

            await request(app).patch("/api/notifications/1/read").expect(500);
        });
    });
});
