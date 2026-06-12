const { describe, it, expect, beforeAll } = require("@jest/globals");
const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();
const mockFindUniqueOrThrow = jest.fn();
const mockFindFirstOrThrow = jest.fn();
const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockHashPassword = jest.fn();
const mockComparePassword = jest.fn();
const mockTransaction = jest.fn();

jest.mock("jsonwebtoken", () => ({
    default: {
        sign: (...args) => mockJwtSign(...args),
        verify: (...args) => mockJwtVerify(...args),
    },
    sign: (...args) => mockJwtSign(...args),
    verify: (...args) => mockJwtVerify(...args),
}));

jest.mock("../db/db.ts", () => ({
    prisma: {
        user: {
            findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
            findFirstOrThrow: (...args) => mockFindFirstOrThrow(...args),
            create: (...args) => mockCreateUser(...args),
            update: (...args) => mockUpdateUser(...args),
            findMany: (...args) => mockFindMany(...args),
            count: (...args) => mockCount(...args),
        },
        $transaction: (...args) => mockTransaction(...args),
    },
}));

jest.mock("../utils/password.util.js", () => ({
    default: {
        HashPassword: (...args) => mockHashPassword(...args),
        ComparePassword: (...args) => mockComparePassword(...args),
    },
    HashPassword: (...args) => mockHashPassword(...args),
    ComparePassword: (...args) => mockComparePassword(...args),
}));

jest.mock("../lib/redis.lib.js", () => ({
    redis: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        scan: jest.fn().mockResolvedValue(["0", []]),
        del: jest.fn().mockResolvedValue(1),
    },
}));

const UserRouter = require("../routes/user.router.js").default;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", UserRouter);

describe("User API Unit Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/users", () => {
        it("Should return a list of users", async () => {
            const mockManager = { user_id: "123", role: "manager" };
            const mockUsers = [
                { user_id: "456", name: "John Doe", email: "john@example.com" },
                { user_id: "789", name: "Jane Doe", email: "jane@example.com" },
            ];

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);
            mockTransaction.mockResolvedValue([2, mockUsers]);

            const res = await request(app)
                .get("/api/users")
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockUsers);
            expect(res.body.meta.total).toBe(2);
        });
    });

    describe("POST /api/users/create", () => {
        it("Should return a new user on valid inputs and permissions", async () => {
            const mockManager = { user_id: "123", name: "Kaiser Lycan", role: "manager" };
            const mockNewUser = {
                user_id: "456",
                name: "John Doe",
                role: "staff",
                email: "jd@example.com",
                phone: "12345678",
                status: "active",
            };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);
            mockHashPassword.mockReturnValue("hashed_password");
            mockCreateUser.mockResolvedValue(mockNewUser);

            const res = await request(app)
                .post("/api/users/create")
                .send({
                    name: "John Doe",
                    email: "jd@example.com",
                    phone: "12345678",
                    password: "00000000",
                    role: "staff",
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockNewUser);
        });

        it("Should return 403 error if staff role tries to create user", async () => {
            const mockStaff = { user_id: "123", role: "staff" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue(mockStaff);

            const res = await request(app)
                .post("/api/users/create")
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(403);
            expect(res.body.error).toEqual(
                "Forbidden. You do not have permission to access this resource.",
            );
        });

        it("Should return 401 if unauthenticated user tries to create user", async () => {
            const res = await request(app).post("/api/users/create");
            expect(res.status).toBe(401);
        });

        it("Should return 400 error for missing inputs", async () => {
            const mockManager = { user_id: "123", role: "manager" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);

            const res = await request(app)
                .post("/api/users/create")
                .send({})
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Name is required.");
            expect(res.body.error).toContain("Email is required.");
            expect(res.body.error).toContain("Phone number is required.");
            expect(res.body.error).toContain("Password is required.");
            expect(res.body.error).toContain("Role is required.");
        });

        it("Should return 400 error for invalid inputs", async () => {
            const mockManager = { user_id: "123", role: "manager" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);

            const res = await request(app)
                .post("/api/users/create")
                .send({
                    name: "J",
                    email: "invalid.email",
                    phone: "12345678",
                    password: "123",
                    role: "invalid",
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Name must be at least 2 characters.");
            expect(res.body.error).toContain("Invalid email address.");
            expect(res.body.error).toContain("Password must be at least 8 characters long.");
            expect(res.body.error).toContain("Role must be either 'staff' or 'manager'.");
        });
    });

    describe("PATCH /api/users/change-password", () => {
        it("Should change password", async () => {
            const mockUser = { user_id: "123", password: "hashed_password" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindFirstOrThrow.mockResolvedValue(mockUser);
            mockComparePassword.mockResolvedValue(true);
            mockHashPassword.mockResolvedValue("hashed_new_password");
            mockUpdateUser.mockResolvedValue({ ...mockUser, password: "hashed_new_password" });

            const res = await request(app)
                .patch("/api/users/change-password")
                .send({ old_password: "old_password", new_password: "new_password" })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password has been changed.");
        });

        it("Should return 400 for missing inputs", async () => {
            const mockUser = { user_id: "123" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockImplementationOnce(() => Promise.resolve(mockUser));

            const res = await request(app)
                .patch("/api/users/change-password")
                .send({})
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Old password is required");
            expect(res.body.error).toContain("New Password is required.");
        });

        it("Should return 400 if old password and new password are the same", async () => {
            const mockUser = { user_id: "123" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockImplementationOnce(() => Promise.resolve(mockUser));

            const res = await request(app)
                .patch("/api/users/change-password")
                .send({ old_password: "same_password", new_password: "same_password" })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error[0]).toBe("New password cannot be the same as the old password");
        });

        it("Should return 400 if old password is not current password", async () => {
            const mockUser = { user_id: "123", password: "current_password" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindFirstOrThrow.mockResolvedValue(mockUser);
            mockComparePassword.mockResolvedValue(false);

            const res = await request(app)
                .patch("/api/users/change-password")
                .send({ old_password: "diff_password", new_password: "new_password" })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Old password doesn't match with current password.");
        });
    });

    describe("PATCH /api/users/reset-password/:user_id", () => {
        it("should allow managers to reset specific user's password.", async () => {
            const mockManager = { user_id: "123", role: "manager" };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);
            mockHashPassword.mockResolvedValue("new_hashed_password");
            mockUpdateUser.mockResolvedValue({ user_id: "456" });

            const res = await request(app)
                .patch("/api/users/reset-password/456")
                .send({ new_password: "new_password" })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password has been reset.");
        });
    });

    describe("PATCH /api/users/deactivate/:user_id", () => {
        it("should allow managers to deactivate a specific user account", async () => {
            const mockManager = { user_id: "123", role: "manager" };
            const mockUser = {
                user_id: "456",
                status: "active",
                email: "sample@example.com",
                phone: "000000",
                role: "staff",
            };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow
                .mockResolvedValueOnce(mockManager)
                .mockResolvedValueOnce(mockUser);
            mockUpdateUser.mockResolvedValue({ ...mockUser, status: "inactive" });

            const res = await request(app)
                .patch("/api/users/deactivate/456")
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ...mockUser, status: "inactive" });
        });
    });

    describe("PATCH /api/users/activate/:user_id", () => {
        it("should allow managers to activate a specific user account", async () => {
            const mockManager = { user_id: "123", role: "manager" };
            const mockUser = {
                user_id: "456",
                status: "inactive",
                email: "sample@example.com",
                phone: "000000",
                role: "staff",
            };

            mockJwtVerify.mockImplementationOnce(() => ({ user_id: "123" }));
            mockFindUniqueOrThrow
                .mockResolvedValueOnce(mockManager)
                .mockResolvedValueOnce(mockUser);
            mockUpdateUser.mockResolvedValue({ ...mockUser, status: "active" });

            const res = await request(app)
                .patch("/api/users/activate/456")
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ...mockUser, status: "active" });
        });
    });
});
