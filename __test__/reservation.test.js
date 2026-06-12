import { describe, it, expect, jest, beforeAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";

const mockJwtVerify = jest.fn();
const mockUserFindUniqueOrThrow = jest.fn();
const mockRequestFindMany = jest.fn();
const mockRequestFindUniqueOrThrow = jest.fn();
const mockRequestCreate = jest.fn();
const mockRequestUpdate = jest.fn();
const mockRequestCount = jest.fn();
const mockBeneficiaryFindUniqueOrThrow = jest.fn();
const mockPasteurizedMilkFindMany = jest.fn();
const mockRequestBottlesCreateMany = jest.fn();
const mockSendAllocationNotification = jest.fn();

jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: {
        verify: (...args) => mockJwtVerify(...args),
    },
    verify: (...args) => mockJwtVerify(...args),
}));

jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        user: {
            findUniqueOrThrow: (...args) => mockUserFindUniqueOrThrow(...args),
        },
        request: {
            findMany: (...args) => mockRequestFindMany(...args),
            findUniqueOrThrow: (...args) => mockRequestFindUniqueOrThrow(...args),
            create: (...args) => mockRequestCreate(...args),
            update: (...args) => mockRequestUpdate(...args),
            count: (...args) => mockRequestCount(...args),
        },
        beneficiary: {
            findUniqueOrThrow: (...args) => mockBeneficiaryFindUniqueOrThrow(...args),
        },
        pasteurized_milk: {
            findMany: (...args) => mockPasteurizedMilkFindMany(...args),
        },
        request_bottles: {
            createMany: (...args) => mockRequestBottlesCreateMany(...args),
        },
    },
}));

jest.mock("../service/email.service.js", () => ({
    __esModule: true,
    SendAllocationNotification: (...args) => mockSendAllocationNotification(...args),
}));

import ReservationRouter from "../routes/reservation.router.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/reservations", ReservationRouter);

describe("Reservation API Unit Tests", () => {
    beforeAll(() => {
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockJwtVerify.mockReturnValue({ user_id: "test-staff-uuid" });
        mockUserFindUniqueOrThrow.mockResolvedValue({ user_id: "test-staff-uuid", role: "staff" });
        mockSendAllocationNotification.mockResolvedValue(undefined);
    });

    describe("GET /api/reservations", () => {
        it("Should fetch all requests", async () => {
            const mockRequests = [
                { rid: 1, request_status: "waiting", requested_vol_ml: 150 },
                { rid: 2, request_status: "allocated", requested_vol_ml: 200 },
            ];
            mockRequestFindMany.mockResolvedValue(mockRequests);
            mockRequestCount.mockResolvedValue(2);

            const res = await request(app)
                .get("/api/reservations")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockRequests);
            expect(res.body.meta).toEqual({
                total: 2,
                page: 1,
                limit: 10,
                total_pages: 1,
            });
        });

        it("Should fetch requests filtered by status", async () => {
            const mockRequests = [{ rid: 1, request_status: "waiting" }];
            mockRequestFindMany.mockResolvedValue(mockRequests);
            mockRequestCount.mockResolvedValue(1);

            const res = await request(app)
                .get("/api/reservations?request_status=waiting")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockRequests);
            expect(res.body.meta.total).toBe(1);
        });
    });

    describe("GET /api/reservations/:rid", () => {
        it("Should fetch a specific request", async () => {
            const mockRequest = { rid: 1, request_status: "waiting", requested_vol_ml: 150 };
            mockRequestFindUniqueOrThrow.mockResolvedValue(mockRequest);

            const res = await request(app)
                .get("/api/reservations/1")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockRequest);
        });

        it("Should return 404 if request not found", async () => {
            const error = new Error("Not found");
            error.code = "P2025";
            mockRequestFindUniqueOrThrow.mockRejectedValue(error);

            const res = await request(app)
                .get("/api/reservations/999")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Request not found.");
        });
    });

    describe("POST /api/reservations", () => {
        it("Should create a new request", async () => {
            const mockBeneficiary = { bid: 1, name: "Baby Cruz", application_status: "approved" };
            const mockNewRequest = {
                rid: 1,
                bid: 1,
                requested_vol_ml: 150,
                request_status: "waiting",
                beneficiary: { bid: 1, name: "Baby Cruz" },
            };

            mockBeneficiaryFindUniqueOrThrow.mockResolvedValue(mockBeneficiary);
            mockRequestCreate.mockResolvedValue(mockNewRequest);

            const res = await request(app)
                .post("/api/reservations")
                .set("Cookie", ["access_token=valid_token"])
                .send({ bid: 1, requested_vol_ml: 150 });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockNewRequest);
        });

        it("Should return 400 if bid is missing", async () => {
            const res = await request(app)
                .post("/api/reservations")
                .set("Cookie", ["access_token=valid_token"])
                .send({ requested_vol_ml: 150 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Beneficiary ID is required.");
        });

        it("Should return 400 if requested_vol_ml is missing", async () => {
            const res = await request(app)
                .post("/api/reservations")
                .set("Cookie", ["access_token=valid_token"])
                .send({ bid: 1 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Requested volume is required.");
        });

        it("Should return 400 if requested_vol_ml is 0 or negative", async () => {
            const res = await request(app)
                .post("/api/reservations")
                .set("Cookie", ["access_token=valid_token"])
                .send({ bid: 1, requested_vol_ml: 0 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Requested volume must be greater than 0.");
        });

        it("Should return 400 if beneficiary is not approved", async () => {
            mockBeneficiaryFindUniqueOrThrow.mockResolvedValue({
                bid: 1,
                application_status: "pending",
            });

            const res = await request(app)
                .post("/api/reservations")
                .set("Cookie", ["access_token=valid_token"])
                .send({ bid: 1, requested_vol_ml: 150 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Beneficiary application is not approved.");
        });

        it("Should return 404 if beneficiary not found", async () => {
            const error = new Error("Not found");
            error.code = "P2025";
            mockBeneficiaryFindUniqueOrThrow.mockRejectedValue(error);

            const res = await request(app)
                .post("/api/reservations")
                .set("Cookie", ["access_token=valid_token"])
                .send({ bid: 999, requested_vol_ml: 150 });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Beneficiary not found.");
        });
    });

    describe("PATCH /api/reservations/:rid/cancel", () => {
        it("Should cancel a waiting request", async () => {
            const mockRequest = { rid: 1, request_status: "waiting" };
            const mockUpdated = { rid: 1, request_status: "canceled" };

            mockRequestFindUniqueOrThrow.mockResolvedValue(mockRequest);
            mockRequestUpdate.mockResolvedValue(mockUpdated);

            const res = await request(app)
                .patch("/api/reservations/1/cancel")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(200);
            expect(res.body.request_status).toBe("canceled");
        });

        it("Should return 400 if request is already completed", async () => {
            mockRequestFindUniqueOrThrow.mockResolvedValue({ rid: 1, request_status: "completed" });

            const res = await request(app)
                .patch("/api/reservations/1/cancel")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Cannot cancel a completed request.");
        });

        it("Should return 400 if request is already canceled", async () => {
            mockRequestFindUniqueOrThrow.mockResolvedValue({ rid: 1, request_status: "canceled" });

            const res = await request(app)
                .patch("/api/reservations/1/cancel")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Request is already canceled.");
        });

        it("Should return 404 if request not found", async () => {
            const error = new Error("Not found");
            error.code = "P2025";
            mockRequestFindUniqueOrThrow.mockRejectedValue(error);

            const res = await request(app)
                .patch("/api/reservations/999/cancel")
                .set("Cookie", ["access_token=valid_token"]);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Request not found.");
        });
    });

});
