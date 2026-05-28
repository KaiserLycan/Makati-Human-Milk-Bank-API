import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../db/db.ts';

describe("User Integration Tests (POST /api/users)", () => {

    const testEmails = ["integration@example.com", "duplicate@example.com"];
    const testPhones = ["+1234567890", "+1111111111"];

    const cleanUpTestUsers = async () => {
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email_add: { in: testEmails } },
                    { phone_num: { in: testPhones } }
                ]
            }
        });
    };

    beforeEach(async () => {
        await cleanUpTestUsers();
    });

    afterAll(async () => {
        await cleanUpTestUsers();
        await prisma.$disconnect();
    });

    it("should write a new user to the actual database and return 201", async () => {
        const userData = {
            name: "Integration Test User",
            email_add: "integration@example.com",
            phone_num: "+1234567890",
            password: "SecurePassword123"
        };

        const response = await request(app)
            .post("/api/users")
            .send(userData);

        expect(response.status).toBe(201);
    });
});