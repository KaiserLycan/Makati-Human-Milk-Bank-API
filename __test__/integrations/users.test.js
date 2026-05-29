import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../db/db.ts';
import dotenv from 'dotenv';
import {redis} from "../../lib/redis.lib.js";

dotenv.config();

const admin = request.agent(app);

describe("User Integration Tests", () => {

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
        await redis.quit();
    }, 10000);

    it("should write a new user to the actual database and return 201", async () => {
        const userData = {
            name: "Integration Test User",
            email_add: "integration@example.com",
            phone_num: "+1234567890",
            password: "SecurePassword123"
        };

        const loginRes = await admin.post("/api/auth/login").send({
            user_id: process.env.TEST_ID,
            password: process.env.TEST_PASSWORD
        });

        const response = await admin
            .post("/api/users")
            .send(userData);

        expect(response.status).toBe(201);
        
    });
});