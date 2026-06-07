import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import collectionRouter from "../routes/collection.router.js";

// --- Mocking Prisma ---
const mockRawMilkFindMany = jest.fn();
const mockRawMilkCreate = jest.fn();
const mockRawMilkAggregate = jest.fn();
const mockUserFindUniqueOrThrow = jest.fn();
const mockRawMilkFindUnique = jest.fn(); // NEW
const mockRawMilkUpdate = jest.fn();     // NEW
const mockRawMilkDelete = jest.fn();     // NEW

jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        raw_milk: {
            findMany: (...args) => mockRawMilkFindMany(...args),
            create: (...args) => mockRawMilkCreate(...args),
            aggregate: (...args) => mockRawMilkAggregate(...args),
            findUnique: (...args) => mockRawMilkFindUnique(...args), // NEW
            update: (...args) => mockRawMilkUpdate(...args),         // NEW
            delete: (...args) => mockRawMilkDelete(...args)          // NEW
        },
        user: {
            findUniqueOrThrow: (...args) => mockUserFindUniqueOrThrow(...args)
        }
    }
}));

// --- Mocking Redis ---
jest.mock("../lib/redis.lib.js", () => ({
    __esModule: true,
    redis: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        quit: jest.fn()
    }
}));

// --- Mocking JWT for Auth Middleware ---
const mockJwtVerify = jest.fn();

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        verify: (...args) => mockJwtVerify(...args),
    },
    verify: (...args) => mockJwtVerify(...args),
}));

// --- Setup Express App (Mirrors server.js router mounting) ---
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/collections", collectionRouter); // FIXED: Explicitly mounted path

describe("Collection API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockJwtVerify.mockReturnValue({ user_id: "test-staff-uuid" });
        mockUserFindUniqueOrThrow.mockResolvedValue({ user_id: "test-staff-uuid", role: "staff" });
    });

    describe("GET /api/collections", () => {
        it("Should fetch all collections ordered by created_at desc", async () => {
            const mockCollections = [{ ctn: 1, volume_ml: 100 }, { ctn: 2, volume_ml: 150 }];
            mockRawMilkFindMany.mockResolvedValue(mockCollections);

            const res = await request(app)
                .get("/api/collections")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockCollections);
        });

        it("Should fetch collections with query filters", async () => {
            const mockCollections = [{ ctn: 1, program: 'ST' }];
            mockRawMilkFindMany.mockResolvedValue(mockCollections);

            const res = await request(app)
                .get("/api/collections?program=ST&qat_status=pass")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockCollections);
        });
    });

    describe("POST /api/collections/supsup-todo", () => {
        it("Should log a Supsup-Todo collection and return 201", async () => {
            const mockInput = { dtn: 1, volume_ml: 150, expiration_date: "2024-12-31T00:00:00.000Z", health_center: "Center A", remarks: "" };
            const mockOutput = { ...mockInput, program: "ST", collected_by: "test-staff-uuid" };

            mockRawMilkCreate.mockResolvedValue(mockOutput);

            const res = await request(app)
                .post("/api/collections/supsup-todo")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(201);
            expect(res.body.program).toBe("ST");
            expect(res.body.health_center).toBe("Center A");
        });

        it("Should return 400 if health_center is missing", async () => {
            const mockInput = { dtn: 1, volume_ml: 150, expiration_date: "2024-12-31" };

            const res = await request(app)
                .post("/api/collections/supsup-todo")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Health center is required.");
        });
    });

    describe("POST /api/collections/moms-act", () => {
        it("Should log a Moms-Act collection and return 201", async () => {
            const mockInput = { dtn: 2, volume_ml: 120, expiration_date: "2024-12-31T00:00:00.000Z", remarks: "" };
            const mockOutput = { ...mockInput, program: "MA", collected_by: "test-staff-uuid" };

            mockRawMilkCreate.mockResolvedValue(mockOutput);

            const res = await request(app)
                .post("/api/collections/moms-act")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(201);
            expect(res.body.program).toBe("MA");
        });
    });

    describe("POST /api/collections/milkyway", () => {
        it("Should log a Milky Way collection and return 201", async () => {
            const mockInput = { dtn: 3, volume_ml: 200, expiration_date: "2024-12-31T00:00:00.000Z", hospital: "Hospital X", remarks: "" };
            const mockOutput = { ...mockInput, program: "MW", collected_by: "test-staff-uuid" };

            mockRawMilkCreate.mockResolvedValue(mockOutput);

            const res = await request(app)
                .post("/api/collections/milkyway")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(201);
            expect(res.body.program).toBe("MW");
            expect(res.body.hospital).toBe("Hospital X");
        });

        it("Should return 400 if hospital is missing", async () => {
            const mockInput = { dtn: 3, volume_ml: 200, expiration_date: "2024-12-31" };

            const res = await request(app)
                .post("/api/collections/milkyway")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Hospital is required.");
        });
    });

    describe("POST /api/collections/walkin", () => {
        it("Should log a Walk-in collection and return 201 if within limit", async () => {
            const mockInput = { dtn: 4, volume_ml: 100, expiration_date: "2024-12-31T00:00:00.000Z", remarks: "" };
            const mockOutput = { ...mockInput, program: "WI", collected_by: "test-staff-uuid" };

            mockRawMilkAggregate.mockResolvedValue({ _sum: { volume_ml: 500 } });
            mockRawMilkCreate.mockResolvedValue(mockOutput);

            const res = await request(app)
                .post("/api/collections/walkin")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(201);
            expect(res.body.program).toBe("WI");
            expect(res.body.volume_ml).toBe(100);
        });

        it("Should return 400 if volume is less than 30 or greater than 240", async () => {
            const mockInput = { dtn: 4, volume_ml: 20, expiration_date: "2024-12-31T00:00:00.000Z", remarks: "" };

            const res = await request(app)
                .post("/api/collections/walkin")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Volume must be between 30 and 240 ml.");
        });

        it("Should return 400 if daily limit exceeded", async () => {
            const mockInput = { dtn: 4, volume_ml: 150, expiration_date: "2024-12-31T00:00:00.000Z", remarks: "" };

            // 700 + 150 = 850 > 800
            mockRawMilkAggregate.mockResolvedValue({ _sum: { volume_ml: 700 } });

            const res = await request(app)
                .post("/api/collections/walkin")
                .set("Cookie", ["access_token=valid_token"])
                .send(mockInput);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Collection exceeds daily limit. Current total today is 700 ml.");
        });
    });

    describe("PUT /api/collections/:ctn", () => {
        it("Should successfully update collection data", async () => {
            const oldRecord = { ctn: 1, volume_ml: 100, hospital: "Old Hospital" };
            const updatedRecord = { ctn: 1, volume_ml: 150, hospital: "New Hospital" };
            
            mockRawMilkFindUnique.mockResolvedValue(oldRecord);
            mockRawMilkUpdate.mockResolvedValue(updatedRecord);

            const res = await request(app)
                .put("/api/collections/1")
                .set("Cookie", ["access_token=valid_token"])
                .send({ volume_ml: 150, hospital: "New Hospital" });

            expect(res.status).toBe(200);
            expect(res.body.volume_ml).toBe(150);
            expect(res.body.hospital).toBe("New Hospital");
            expect(mockRawMilkUpdate).toHaveBeenCalled();
        });

        it("Should return 404 if the collection to update doesn't exist", async () => {
            mockRawMilkFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .put("/api/collections/999")
                .set("Cookie", ["access_token=valid_token"])
                .send({ volume_ml: 200 });

            expect(res.status).toBe(404);
            // Updated to match your server's actual response
            expect(res.body.error).toBe("Collection record not found.");
        });
    });

    describe("DELETE /api/collections/:ctn", () => {
        it("Should successfully delete a collection", async () => {
            mockRawMilkDelete.mockResolvedValue({ ctn: 1 });

            const res = await request(app)
                .delete("/api/collections/1")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            // Updated to match your server's actual response
            expect(res.body.message).toBe("Collection record deleted successfully.");
            expect(mockRawMilkDelete).toHaveBeenCalledWith({ where: { ctn: 1 } });
        });

        it("Should return 404 if the collection to delete doesn't exist", async () => {
            mockRawMilkDelete.mockRejectedValue({ code: 'P2025' });

            const res = await request(app)
                .delete("/api/collections/999")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(404);
            // Updated to match your server's actual response
            expect(res.body.error).toBe("Collection record not found.");
        });
    });

    describe("PATCH /api/collections/:ctn/milk-status", () => {
        it("Should successfully update milk_status", async () => {
            const updatedRecord = { ctn: 1, milk_status: "discarded" };
            mockRawMilkUpdate.mockResolvedValue(updatedRecord);

            const res = await request(app)
                .patch("/api/collections/1/milk-status")
                .set("Cookie", ["access_token=valid_token"])
                .send({ milk_status: "discarded" });

            expect(res.status).toBe(200);
            expect(res.body.milk_status).toBe("discarded");
        });

        it("Should return 400 for invalid milk_status enum", async () => {
            const res = await request(app)
                .patch("/api/collections/1/milk-status")
                .set("Cookie", ["access_token=valid_token"])
                .send({ milk_status: "sour" });

            expect(res.status).toBe(400);
            // Updated to match your server's actual response
            expect(res.body.error).toBe("Invalid milk status. Allowed values are: good, contaminated, discarded, expired.");
        });
    });

    describe("PATCH /api/collections/:ctn/qat-status", () => {
        it("Should successfully update qat_status", async () => {
            const updatedRecord = { ctn: 1, qat_status: "pass" };
            mockRawMilkUpdate.mockResolvedValue(updatedRecord);

            const res = await request(app)
                .patch("/api/collections/1/qat-status")
                .set("Cookie", ["access_token=valid_token"])
                .send({ qat_status: "pass" }); // Sending 'pass'

            expect(res.status).toBe(200);
            expect(res.body.qat_status).toBe("pass"); // Expecting 'pass'
        });

        it("Should return 400 for invalid qat_status enum", async () => {
            const res = await request(app)
                .patch("/api/collections/1/qat-status")
                .set("Cookie", ["access_token=valid_token"])
                .send({ qat_status: "maybe" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid QAT status. Allowed values are: pending, pass, fail.");
        });
    });
});