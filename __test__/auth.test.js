import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

const mockLogin = jest.fn((req, res) =>
    res.status(200).json({
        success: true,
        data: { user_id: "test-user" },
        message: "Logged in successfully.",
    }),
);

const mockLogout = jest.fn((req, res) =>
    res.status(200).json({ success: true, message: "Logged out successfully." }),
);

jest.mock("../controllers/auth.controllers.js", () => ({
    login: (req, res) => mockLogin(req, res),
    logout: (req, res) => mockLogout(req, res),
}));

jest.mock("../middleware/protectRoute.js", () => ({
    protectRoute: (req, res, next) => next(),
}));

describe("Auth Router", () => {
    let app;

    beforeEach(async () => {
        const authRouter = (await import("../routers/auth.routers.js")).default;
        app = express();
        app.use(express.json());
        app.use("/auth", authRouter);
    });

    describe("POST /login", () => {
        it("should log in a user with valid credentials", async () => {
            const credentials = { email: "test@example.com", password: "password" };
            const response = await request(app).post("/auth/login").send(credentials);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should not log in a user with invalid credentials", async () => {
            mockLogin.mockImplementationOnce((req, res) => {
                res.status(400).json({ success: false, message: "Invalid Credentials" });
            });
            const credentials = { email: "wrong@example.com", password: "wrong" };
            const response = await request(app).post("/auth/login").send(credentials);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /logout", () => {
        it("should log out an authenticated user", async () => {
            const response = await request(app).post("/auth/logout");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
