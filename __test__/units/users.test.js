import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';

jest.mock('../../db/db.ts', () => {
    return {
        __esModule: true,
        prisma: {
            user: {
                create: jest.fn()
            }
        }
    };
});

import { prisma } from '../../db/db.ts';

describe("POST /api/users", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Should successfully create a user and return 201 status", async () => {
        const mockDbUser = {
            user_id: "mocked-uuid-1234",
            name: "Joseph Rey",
            email_add: "joseph@example.com",
            phone_num: "09123456789",
            role: "staff",
            account_status: "active"
        };

        prisma.user.create.mockResolvedValue(mockDbUser);

        const userData = {
            name: "Joseph Rey",
            email_add: "joseph@example.com",
            phone_num: "09123456789",
            password: "SecurePassword123"
        };

        const response = await request(app)
            .post("/api/users")
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            id: mockDbUser.user_id,
            name: mockDbUser.name,
            email: mockDbUser.email_add,
            phone_num: mockDbUser.phone_num,
            role: mockDbUser.role,
            account_status: mockDbUser.account_status
        });

        expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it("Should return 400 if email or phone number already exists (Prisma P2002)", async () => {
        const prismaError = new Error("Unique constraint failed");
        prismaError.code = "P2002";
        prisma.user.create.mockRejectedValue(prismaError);

        const userData = {
            name: "Joseph Rey",
            email_add: "duplicate@example.com",
            phone_num: "09123456789",
            password: "SecurePassword123"
        };

        const response = await request(app)
            .post("/api/users")
            .send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Email or Phone Number already exists."
        });
    });
});