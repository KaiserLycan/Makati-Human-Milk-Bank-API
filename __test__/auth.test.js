import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "../src/v2/auth/auth.router.js";

jest.mock("../src/middleware/protectRoute.js", () => ({
    ProtectRoute: jest.fn((req, res, next) => {
        req.user = { user_id: "123" };
        next();
    }),
}));

const mockValidateCredentials = jest.fn();
jest.mock("../src/v2/auth/auth.service.js", () => ({
    __esModule: true,
    ValidateCredentials: (...args) => mockValidateCredentials(...args),
}));

const mockGenerateAccessToken = jest.fn();
jest.mock("../lib/utils/tokens.util.js", () => ({
    __esModule: true,
    GenerateAccessToken: (...args) => mockGenerateAccessToken(...args),
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);

describe("Authentication API Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/auth/login", () => {
        it("Should authenticate user and generate tokens on valid credentials", async () => {
            const mockUser = {
                user_id: "123",
                name: "John Doe",
                email: "jd@example.com",
                role: "manager",
                phone: "12345678",
                status: "active",
            };

            mockValidateCredentials.mockResolvedValue(mockUser);
            mockGenerateAccessToken.mockResolvedValue("some-token");

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "jd@example.com", password: "password" });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockUser);
            expect(mockValidateCredentials).toHaveBeenCalledWith({
                email: "jd@example.com",
                password: "password",
            });
            expect(mockGenerateAccessToken).toHaveBeenCalledWith(expect.any(Object), "123");
        });

        it("should return 400 if validation fails", async () => {
            mockValidateCredentials.mockRejectedValue({ message: "Invalid Credentials" });

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "jd@example.com", password: "wrong_password" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid Credentials");
        });

        it("should return 500 on an internal server error", async () => {
            mockValidateCredentials.mockRejectedValue(new Error("DB connection lost"));

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "user@example.com", password: "password" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal Server Error");
        });
    });

    describe("POST /api/auth/logout", () => {
        it("Should clear access token on logout", async () => {
            const res = await request(app).post("/api/auth/logout");

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Successfully logged out" });
            expect(res.headers["set-cookie"][0]).toContain("access_token=;");
        });
    });
});
