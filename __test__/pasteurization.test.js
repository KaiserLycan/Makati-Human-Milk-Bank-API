import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import pasteurizationRouter from "../src/v2/processing/pasteurization.router.js";

// --- Mocking Prisma ---
const mockPoolFindUnique = jest.fn();
const mockPasteurizedCreateMany = jest.fn();
const mockPasteurizedUpdate = jest.fn(); // NEW MOCK ADDED
const mockUserFindUniqueOrThrow = jest.fn();

jest.mock("../lib/db/db.ts", () => ({
    __esModule: true,
    prisma: {
        pool_milk: {
            findUnique: (...args) => mockPoolFindUnique(...args),
        },
        pasteurized_milk: {
            createMany: (...args) => mockPasteurizedCreateMany(...args),
            update: (...args) => mockPasteurizedUpdate(...args), // NEW MOCK ADDED
        },
        user: {
            findUniqueOrThrow: (...args) => mockUserFindUniqueOrThrow(...args),
        },
    },
}));

// --- Mocking JWT for Auth Middleware ---
const mockJwtVerify = jest.fn();
jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: { verify: (...args) => mockJwtVerify(...args) },
    verify: (...args) => mockJwtVerify(...args),
}));

// --- Setup Express App ---
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/pasteurization", pasteurizationRouter);

describe("Pasteurization API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockJwtVerify.mockReturnValue({ user_id: "test-staff-uuid" });
        mockUserFindUniqueOrThrow.mockResolvedValue({ user_id: "test-staff-uuid", role: "staff" });
    });

    // --- R45 & R46: BATCHING TESTS ---
    describe("POST /api/pasteurization/batch", () => {
        it("Should successfully batch bottles from a pool", async () => {
            mockPoolFindUnique.mockResolvedValue({
                pid: 1,
                actual_volume_ml: 1000,
                expiration_date: new Date(),
            });
            mockPasteurizedCreateMany.mockResolvedValue({ count: 5 });

            const res = await request(app)
                .post("/api/pasteurization/batch")
                .set("Cookie", ["access_token=valid_token"])
                .send({
                    pid: 1,
                    batch_number: 101,
                    bottle_count: 5,
                    volume_per_bottle: 100,
                    bottle_type: "ameda",
                    pasteurization_date: "2026-06-08T00:00:00.000Z",
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toContain("Batch logged successfully with 5 bottles.");
            expect(mockPasteurizedCreateMany).toHaveBeenCalled();
        });

        it("Should return 400 if trying to batch more volume than the pool holds", async () => {
            mockPoolFindUnique.mockResolvedValue({
                pid: 1,
                actual_volume_ml: 200,
                expiration_date: new Date(),
            });

            const res = await request(app)
                .post("/api/pasteurization/batch")
                .set("Cookie", ["access_token=valid_token"])
                .send({
                    pid: 1,
                    batch_number: 101,
                    bottle_count: 5,
                    volume_per_bottle: 100,
                    bottle_type: "ameda",
                    pasteurization_date: "2026-06-08T00:00:00.000Z",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("exceeds pool's actual volume");
            expect(mockPasteurizedCreateMany).not.toHaveBeenCalled();
        });

        it("Should return 404 if the pool does not exist", async () => {
            mockPoolFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/pasteurization/batch")
                .set("Cookie", ["access_token=valid_token"])
                .send({
                    pid: 999,
                    batch_number: 101,
                    bottle_count: 5,
                    volume_per_bottle: 100,
                    bottle_type: "ameda",
                    pasteurization_date: "2026-06-08T00:00:00.000Z",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Pool with given PID not found.");
        });
    });

    // --- R47: INCIDENT TESTS ---
    describe("PATCH /api/pasteurization/:btl_id/incident", () => {
        it("Should successfully report an incident (leakage/contamination)", async () => {
            const updatedBottle = { btl_id: 1, volume_ml: 80, milk_status: "contaminated" };
            mockPasteurizedUpdate.mockResolvedValue(updatedBottle);

            const res = await request(app)
                .patch("/api/pasteurization/1/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({
                    volume_ml: 80,
                    milk_status: "contaminated",
                    remarks: "Leaked during process",
                });

            expect(res.status).toBe(200);
            // Notice we added .bottle here to match your nested response
            expect(res.body.bottle.milk_status).toBe("contaminated");
            expect(res.body.bottle.volume_ml).toBe(80);
            expect(mockPasteurizedUpdate).toHaveBeenCalled();
        });

        it("Should return 400 for invalid milk_status", async () => {
            const res = await request(app)
                .patch("/api/pasteurization/1/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({ milk_status: "bad" });

            expect(res.status).toBe(400);
            // Matches your controller's exact string
            expect(res.body.error).toBe(
                "Invalid milk status. Must be one of: good, contaminated, discarded, expired.",
            );
        });

        it("Should return 404 if the bottle to report doesn't exist", async () => {
            mockPasteurizedUpdate.mockRejectedValue({ code: "P2025" });

            const res = await request(app)
                .patch("/api/pasteurization/999/incident")
                .set("Cookie", ["access_token=valid_token"])
                .send({ milk_status: "discarded" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Bottle record not found.");
        });
    });

    // --- R48, R49, R50: MBT STATUS TESTS ---
    describe("PATCH /api/pasteurization/:btl_id/mbt", () => {
        it("Should pass MBT and set dispense_status to available (R48, R50)", async () => {
            const updatedBottle = { btl_id: 1, mbt_status: "pass", dispense_status: "available" };
            mockPasteurizedUpdate.mockResolvedValue(updatedBottle);

            const res = await request(app)
                .patch("/api/pasteurization/1/mbt")
                .set("Cookie", ["access_token=valid_token"])
                .send({ mbt_status: "pass" });

            expect(res.status).toBe(200);
            // Notice we added .bottle here
            expect(res.body.bottle.mbt_status).toBe("pass");
            expect(res.body.bottle.dispense_status).toBe("available");
        });

        it("Should fail MBT and set milk_status to discarded (R48, R49)", async () => {
            const updatedBottle = { btl_id: 2, mbt_status: "fail", milk_status: "discarded" };
            mockPasteurizedUpdate.mockResolvedValue(updatedBottle);

            const res = await request(app)
                .patch("/api/pasteurization/2/mbt")
                .set("Cookie", ["access_token=valid_token"])
                .send({ mbt_status: "fail", remarks: "Failed bacterial count" });

            expect(res.status).toBe(200);
            // Notice we added .bottle here
            expect(res.body.bottle.mbt_status).toBe("fail");
            expect(res.body.bottle.milk_status).toBe("discarded");
        });

        it("Should return 400 for invalid mbt_status", async () => {
            const res = await request(app)
                .patch("/api/pasteurization/1/mbt")
                .set("Cookie", ["access_token=valid_token"])
                .send({ mbt_status: "pending" });

            expect(res.status).toBe(400);
            // Matches your controller's exact string
            expect(res.body.error).toBe("Invalid MBT status. Must be either 'pass' or 'fail'.");
        });
    });
});
