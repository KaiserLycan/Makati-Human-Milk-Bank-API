import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { runExpirationCheck } from "../service/expiration.service.js";
import { SendCancellationNotification } from "../service/email.service.js";

// 1. Mock Prisma correctly via the db.ts file
const mockUserFindMany = jest.fn();
const mockNotificationCreateMany = jest.fn();
const mockRawMilkFindMany = jest.fn();
const mockRawMilkUpdate = jest.fn();
const mockPoolMilkFindMany = jest.fn();
const mockPoolMilkUpdate = jest.fn();
const mockPasteurizedMilkFindMany = jest.fn();
const mockPasteurizedMilkUpdate = jest.fn();
const mockRequestUpdate = jest.fn();

jest.mock("../db/db.ts", () => ({
    __esModule: true,
    prisma: {
        user: { findMany: (...args) => mockUserFindMany(...args) },
        notification: { createMany: (...args) => mockNotificationCreateMany(...args) },
        raw_milk: {
            findMany: (...args) => mockRawMilkFindMany(...args),
            update: (...args) => mockRawMilkUpdate(...args),
        },
        pool_milk: {
            findMany: (...args) => mockPoolMilkFindMany(...args),
            update: (...args) => mockPoolMilkUpdate(...args),
        },
        pasteurized_milk: {
            findMany: (...args) => mockPasteurizedMilkFindMany(...args),
            update: (...args) => mockPasteurizedMilkUpdate(...args),
        },
        request: { update: (...args) => mockRequestUpdate(...args) },
    },
}));

// 2. Mock the Email Service
jest.mock("../service/email.service.js", () => ({
    SendCancellationNotification: jest.fn(),
}));

describe("Expiration Service Logic", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should notify staff (R59) and cancel requests/notify beneficiaries (R60) when pasteurized milk expires", async () => {
        // Setup mock data
        mockUserFindMany.mockResolvedValue([{ user_id: "1", role: "staff" }]);

        // Mock raw and pool milk as empty
        mockRawMilkFindMany.mockResolvedValue([]);
        mockPoolMilkFindMany.mockResolvedValue([]);

        // Mock an expired pasteurized bottle that is attached to a waiting request
        mockPasteurizedMilkFindMany.mockResolvedValue([
            {
                btl_id: 99,
                expiration_date: new Date("2020-01-01"),
                milk_status: "good",
                request_bottles: [
                    {
                        request: {
                            rid: 50,
                            request_status: "waiting",
                            beneficiary: {
                                caregiver_email: "test@example.com",
                                caregiver: "Jane Doe",
                                name: "Baby Doe",
                            },
                        },
                    },
                ],
            },
        ]);

        // Execute the service
        await runExpirationCheck();

        // Assert R59 (Staff Notification)
        expect(mockPasteurizedMilkUpdate).toHaveBeenCalledWith({
            where: { btl_id: 99 },
            data: { milk_status: "expired" },
        });

        expect(mockNotificationCreateMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ entity_type: "pasteurized_milk", entity_id: 99 }),
            ]),
        });

        // Assert R60 (Request Cancellation & Beneficiary Notification)
        expect(mockRequestUpdate).toHaveBeenCalledWith({
            where: { rid: 50 },
            data: { request_status: "canceled" },
        });

        expect(SendCancellationNotification).toHaveBeenCalledWith(
            expect.objectContaining({ caregiver_email: "test@example.com" }),
        );
    });
});
