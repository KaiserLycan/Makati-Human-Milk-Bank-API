import {describe, it, expect, jest} from "@jest/globals"
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import UserRouter from "../routes/user.router.js";

const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();
const mockFindUniqueOrThrow = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockHashPassword = jest.fn();
const mockComparePassword = jest.fn();

jest.mock("jsonwebtoken", () => {
    return {
        __esModule: true,
        default: {
            sign: (...args) => mockJwtSign(...args),
            verify: (...args) => mockJwtVerify(...args),
        },
        sign: (...args) => mockJwtSign(...args),
        verify: (...args) => mockJwtVerify(...args),
    }
})

jest.mock("../db/db.ts", () => {
    return {
        __esModule: true,
        prisma: {
            user: {
                findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
                create: (...args) => mockCreateUser(...args),
                update: (...args) => mockUpdateUser(...args),
            }
        }
    }
});

jest.mock("../utils/password.util.js", () => {
    return {
        __esModule: true,
        default: {
            HashPassword: (...args) => mockHashPassword(...args),
            ComparePassword: (...args) => mockComparePassword(...args),
        },
        HashPassword: (...args) => mockHashPassword(...args),
        ComparePassword: (...args) => mockComparePassword(...args),
    }
})

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(UserRouter);

describe("User API Unit Tests", () => {
    describe("POST /create", () => {
        it ("Should return a new user on valid inputs and permissions", async () => {
            const mockManager = {
                user_id: "123",
                name: "Kaiser Lycan",
                role: "manager"
            }

            const mockNewUser = {
                user_id: "456",
                name: "John Doe",
                role: "staff",
                email: "jd@example.com",
                phone: "12345678",
                password: "00000000",
                status: "active"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);
            mockHashPassword.mockReturnValue("hashed_password");
            mockCreateUser.mockResolvedValue(mockNewUser)

            const res = await request(app)
                .post("/create")
                .send({
                    name: "John Doe",
                    email: "jd@example.com",
                    phone: "12345678",
                    password: "00000000"
                })
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                user_id: "456",
                name: "John Doe",
                role: "staff",
                email: "jd@example.com",
                phone: "12345678",
                status: "active"
            });
        })
        it ("Should return 403 error if staff role tries to create user", async () => {
            const mockManager = {
                user_id: "123",
                role: "staff"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager)

            const res = await request(app)
                .post("/create")
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(403);
            expect(res.body.error).toEqual("Forbidden. You do not have permission to access this resource.");
        })
        it ("Should return 401 if unauthenticated user tries to create user", async () => {
            const res = await request(app)
                .post("/create")
            expect(res.status).toBe(401);
        })
        it ("Should return 400 error for missing inputs", async () => {
            const mockManager = {
                user_id: "123",
                role: "manager"
            }
            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);

            const res = await request(app)
                .post("/create")
                .send({})
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error[0]).toBe("Name is required.");
            expect(res.body.error[1]).toBe("Email is required.");
            expect(res.body.error[2]).toBe("Phone number is required.");
            expect(res.body.error[3]).toBe("Password is required.");
        })
        it ("Should return 400 error for invalid inputs", async () => {
            const mockManager = {
                user_id: "123",
                role: "manager"
            }
            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow.mockResolvedValue(mockManager);

            const res = await request(app)
                .post("/create")
                .send({
                    name: "J",
                    email: "invalid.email",
                    phone: "12345678",
                    password: "123"
                })
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error[0]).toBe("Name must be at least 2 characters.");
            expect(res.body.error[1]).toBe("Invalid email address.");
            expect(res.body.error[2]).toBe("Password must be at least 8 characters long.");
        })
    })

    describe("PATCH /change-password", () => {
        it("Should change password", async () => {
            const mockUser = {
                user_id: "123",
                password: "hashed_password"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow
                .mockImplementationOnce(() => Promise.resolve(mockUser))
                .mockImplementationOnce(() => Promise.resolve(mockUser));
            mockComparePassword.mockResolvedValue(true);
            mockHashPassword.mockResolvedValue("hashed_new_password")
            mockUpdateUser.mockResolvedValue({...mockUser, password: "hashed_new_password"});

            const res = await request(app)
                .patch("/change-password")
                .send({
                    old_password: "old_password",
                    new_password: "new_password"
                })
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password updated successfully.");
            expect(mockUpdateUser).toHaveBeenCalledWith({
                data: {
                    password: "hashed_new_password",
                    modified_by: "123"
                },
                where: {
                    user_id: "123"
                }
            })



        });

        it ("Should return 400 for missing inputs", async () => {
            const mockUser = {
                user_id: "123"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow.mockImplementationOnce(() => Promise.resolve(mockUser));

            const res = await request(app)
                .patch("/change-password")
                .send({})
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error[0]).toBe("Old password is required");
            expect(res.body.error[1]).toBe("New Password is required.");
        });

        it ( "Should return 400 if old password and new password are the same", async () => {
            const mockUser = {
                user_id: "123"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow.mockImplementationOnce(() => Promise.resolve(mockUser));

            const res = await request(app)
                .patch("/change-password")
                .send({
                    old_password: "same_password",
                    new_password: "same_password"
                })
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error[0]).toBe("New password cannot be the same as the old password");
        });

        it ( "Should return 401 if old password is not current password", async () => {
            const mockUser = {
                user_id: "123",
                password: "current_password"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow
                .mockImplementationOnce(() => Promise.resolve(mockUser))
                .mockImplementationOnce(() => Promise.resolve(mockUser));
            mockComparePassword.mockResolvedValue(false);

            const res = await request(app)
                .patch("/change-password")
                .send({
                    old_password: "diff_password",
                    new_password: "new_password"
                })
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Old password does not match current password.");
        });
    })

    describe("PATCH /reset-password", () => {
        it ("should allow managers to reset specific user's password.", async () => {
            const mockManager = {
                user_id: "123",
                role: "manager",
                password: "hashed_password"
            }

            const mockUser = {
                user_id: "456",
                password: "hashed_password"
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow
                .mockImplementationOnce(() => Promise.resolve(mockManager))
                .mockImplementationOnce(() => Promise.resolve(mockUser));
            mockHashPassword.mockResolvedValue("new_hashed_password");
            mockUpdateUser.mockResolvedValue({ user_id: "456", password: "new_hashed_password"});

            const res = await request(app)
                .patch("/456/reset-password")
                .send({
                    new_password: "new_password"
                })
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password reset successfully.");
            expect(mockUpdateUser).toHaveBeenCalledWith({
                data: {
                    password: "new_hashed_password",
                    modified_by: "123",
                },
                where: {
                    user_id: "456",
                },
                select: {
                    password: false
                }
            });

        })
    })

    describe("PATCH /deactivate", () => {
        it ("should allow managers to deactivate a specific user account", async () => {
            const mockManager = {
                user_id: "123",
                role: "manager",
            }

            const mockUser = {
                user_id: "456",
                status: "active",
                email: "sample@example.com",
                phone: "000000",
                role: "staff",
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}));
            mockFindUniqueOrThrow
                .mockImplementationOnce(() => Promise.resolve(mockManager))
                .mockImplementationOnce(() => Promise.resolve(mockUser));
            mockUpdateUser.mockResolvedValue({...mockUser, status: "inactive"});

            const res = await request(app)
                .patch("/456/deactivate")
                .set("Cookie", ["access_token=valaid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({...mockUser, status: "inactive"});
            expect(mockUpdateUser).toHaveBeenCalledWith({
                data: {
                    status: "inactive",
                    modified_by: "123",
                },
                where: {
                    user_id: "456",
                },
                select: {
                    password: false,
                }
            })
        })
    })
})