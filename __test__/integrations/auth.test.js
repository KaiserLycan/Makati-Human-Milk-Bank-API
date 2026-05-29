import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../db/db.ts";
import { expect } from "@jest/globals";

const agent = request.agent(app);

describe("Authentication API Integration Tests", () => {
    const user_id = process.env.TEST_ID;
    const password = process.env.TEST_PASSWORD;

    it("should authenticate user and return access and refresh tokens", async () => {
        const response = await agent
            .post("/api/auth/login")
            .send({ user_id, password });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user_id", user_id);
        expect(response.body).toHaveProperty("email_add");
        expect(response.body).toHaveProperty("phone_num");
        expect(response.body).toHaveProperty("role");
        expect(response.body).toHaveProperty("account_status");
        expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should refresh access token with valid refresh token", async () => {
        const response = await agent
            .post("/api/auth/refresh-token")
            
        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"]).toBeDefined();
        expect(response.headers["set-cookie"][0]).toContain("access_token=");
    })

    it("should remove access token and refresh token locally and on redis when logged out.", async () => {
        const response = await agent
            .post("/api/auth/logout")
        
        expect(response.status).toBe(200);
    })

    it("should return an error for invalid credentials", async () => {
        const response = await agent
            .post("/api/auth/login")
            .send({ user_id, password: "wrongpassword" });
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", "Invalid Credentials");
    });
})