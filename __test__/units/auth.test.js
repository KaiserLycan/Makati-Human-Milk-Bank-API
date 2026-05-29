import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import router from "../../routes/auth.router.js";

const mockFindUniqueOrThrow = jest.fn();
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisQuit = jest.fn();
const mockComparePassword = jest.fn();
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();

jest.mock("../../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        user: {
            findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
        },
    },
}));

jest.mock("../../lib/redis.lib.js", () => ({
    __esModule: true,
    redis: {
        get: (...args) => mockRedisGet(...args),
        set: (...args) => mockRedisSet(...args),
        quit: (...args) => mockRedisQuit(...args),
    },
}));

jest.mock("../../utils/password.util.js", () => ({
    __esModule: true,
    ComparePassword: (...args) => mockComparePassword(...args),
}));

// Mock flat object keys to match application usage patterns
jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: {
        sign: (...args) => mockJwtSign(...args),
        verify: (...args) => mockJwtVerify(...args),
    },
    sign: (...args) => mockJwtSign(...args),
    verify: (...args) => mockJwtVerify(...args),
}));

// Initialize Express App for testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(router);

describe("Authentication API Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
        process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
    });

    // Closes open handle leaks cleanly
    afterAll(async () => {
        await mockRedisQuit();
    });

    describe("POST /login", () => {
        it("should authenticate user and set cookies on valid credentials", async () => {
            const mockUser = {
                user_id: "user123",
                name: "John Doe",
                email_add: "john@example.com",
                phone_num: "123456789",
                account_status: "active",
                password_hash: "hashed_password",
            };

            mockFindUniqueOrThrow.mockResolvedValue(mockUser);
            mockComparePassword.mockResolvedValue(true);
            mockJwtSign.mockReturnValue("mocked_token");

            const response = await request(app)
                .post("/login")
                .send({ user_id: "user123", password: "securepassword" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                user_id: "user123",
                user_name: "John Doe",
                email_add: "john@example.com",
                phone_num: "123456789",
                account_status: "active",
            });
            expect(response.headers["set-cookie"]).toBeDefined();
        });

        it("should return 404 error if password validation fails", async () => {
            mockFindUniqueOrThrow.mockResolvedValue({ password_hash: "hash" });
            mockComparePassword.mockResolvedValue(false);

            const response = await request(app)
                .post("/login")
                .send({ user_id: "user123", password: "wrongpassword" });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Invalid Credentials");
        });
    });

    describe("POST /refresh-token", () => {
        it("should generate a new access token when a valid refresh token is passed", async () => {
            const mockUser = { user_id: "user123" };

            mockJwtVerify
                .mockImplementationOnce(() => ({ user_id: "user123" })) // ProtectRoute access token
                .mockImplementationOnce(() => ({ user_id: "user123" })); // RefreshAccessToken refresh token

            mockFindUniqueOrThrow.mockResolvedValue(mockUser);
            mockRedisGet.mockResolvedValue("valid_refresh_token");
            mockJwtSign.mockReturnValue("new_access_token");

            const response = await request(app)
                .post("/refresh-token")
                .set("Cookie", ["access_token=valid_access_token", "refresh_token=valid_refresh_token"]);

            expect(response.status).toBe(200);
            expect(response.headers["set-cookie"][0]).toContain("access_token=new_access_token");
        });


        it("should return 401 if refresh token does not match the token in Redis", async () => {
            mockJwtVerify
                .mockImplementationOnce(() => ({ user_id: "user123" }))
                .mockImplementationOnce(() => ({ user_id: "user123" }));

            mockFindUniqueOrThrow.mockResolvedValue({ user_id: "user123" });
            mockRedisGet.mockResolvedValue("different_stored_token");

            const response = await request(app)
                .post("/refresh-token")
                .set("Cookie", ["access_token=valid_access_token", "refresh_token=mismatched_token"]);

            console.log(response.body);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Invalid refresh token");
        });
    });
});