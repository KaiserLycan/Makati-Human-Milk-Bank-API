import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "../routes/auth.router.js";

const mockFindUniqueOrThrow = jest.fn();
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();
const mockComparePassword = jest.fn();
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisQuit = jest.fn();

jest.mock("../db/db.ts", () => {
    return {
        __esModule: true,
        prisma: {
            user: {
                findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
            },
        },
    };
});

jest.mock("../lib/redis.lib.js", () => {
    return {
        __esModule: true,
        redis: {
            get: (...args) => mockRedisGet(...args),
            set: (...args) => mockRedisSet(...args),
            del: (...args) => mockRedisDel(...args),
            quit: (...args) => mockRedisQuit(...args),
        },
    };
});

jest.mock("jsonwebtoken", () => {
    return {
        __esModule: true,
        default: {
            sign: (...args) => mockJwtSign(...args),
            verify: (...args) => mockJwtVerify(...args),
        },
        sign: (...args) => mockJwtSign(...args),
        verify: (...args) => mockJwtVerify(...args),
    };
});

jest.mock("../utils/password.util.js", () => {
    return {
        __esModule: true,
        ComparePassword: (...args) => mockComparePassword(...args),
    };
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(authRouter);

describe("Authentication API Unit Tests", () => {
    beforeAll(() => {
        jest.clearAllMocks();
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
        process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
    });

    afterAll(async () => {
        await mockRedisQuit();
    });

    describe("POST /login", () => {
        it("Should authenticate user and set cookies on valid credentials", async () => {
            const mockUser = {
                user_id: "123",
                name: "John Doe",
                email: "jd@example.com",
                role: "manager",
                phone: "12345678",
                password: "hashed_password",
                status: "active",
            };

            mockFindUniqueOrThrow.mockResolvedValue(mockUser);
            mockComparePassword.mockResolvedValue(true);
            mockJwtSign.mockResolvedValue("mocked_token");

            const res = await request(app)
                .post("/login")
                .send({ email: "jd@example.com", password: "12345678" });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                user_id: "123",
                name: "John Doe",
                email: "jd@example.com",
                phone: "12345678",
                role: "manager",
                status: "active",
            });
            expect(res.headers["set-cookie"]).toBeDefined();
        });

        it("should return 400 error if password validation fails", async () => {
            mockFindUniqueOrThrow.mockResolvedValue({ password: "hash", status: "active" });
            mockComparePassword.mockResolvedValue(false);

            const res = await request(app)
                .post("/login")
                .send({ email: "jd@example.com", password: "hash" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid Credentials");
        });

        it("should return 401 if user is not active", async () => {
            const mockUser = {
                user_id: "123",
                name: "John Doe",
                email: "jd@example.com",
                role: "manager",
                phone: "12345678",
                password: "hashed_password",
                status: "inactive",
            };

            mockFindUniqueOrThrow.mockResolvedValue(mockUser);

            const res = await request(app)
                .post("/login")
                .send({ email: "jd@example.com", password: "12345678" });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({
                error: "Authentication failed",
                description: "User account is no longer active.",
            });
        });
    });

    describe("POST /logout", () => {
        it("Should clear access and refresh token and delete refresh token from Redis on logout.", async () => {
            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue({ user_id: "123" });
            mockRedisDel.mockResolvedValue(1);

            const res = await request(app)
                .post("/logout")
                .set("Cookie", [
                    "access_token=valid_access_token",
                    "refresh_token=valid_refresh_token",
                ]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Successfully logged out" });
            expect(res.headers["set-cookie"][0]).toContain("access_token=;");
            expect(res.headers["set-cookie"][1]).toContain("refresh_token=;");
            expect(mockRedisDel).toHaveBeenCalledWith("refresh_token_123");
        });
    });
});
