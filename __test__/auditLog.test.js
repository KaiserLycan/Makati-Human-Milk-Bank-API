const { describe, it, expect, beforeEach } = require("@jest/globals");

const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock("../lib/db/db.ts", () => ({
    prisma: {
        audit_log: {
            findMany: (...args) => mockFindMany(...args),
            count: (...args) => mockCount(...args),
        },
    },
}));

const { FetchAuditLogs } = require("../src/v2/audits/auditLog.controller.js");

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe("FetchAuditLogs controller", () => {
    beforeEach(() => {
        mockFindMany.mockReset();
        mockCount.mockReset();
    });

    const mockLogs = [
        {
            log_id: 1,
            modified_by: "uuid-001",
            action_performed: "INSERT",
            table_name: "donor",
            old_data: null,
            new_data: { name: "Test Donor" },
            performed_at: new Date("2023-01-01T00:00:00.000Z"),
            user: {
                user_id: "uuid-001",
                name: "Staff One",
                role: "staff",
                email: "staff@test.com",
            },
        },
    ];

    it("should return 200 with audit logs and default pagination", async () => {
        mockFindMany.mockResolvedValue(mockLogs);
        mockCount.mockResolvedValue(1);

        const req = { query: {} };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(mockCount).toHaveBeenCalledWith({ where: {} });
        expect(mockFindMany).toHaveBeenCalledWith({
            orderBy: { performed_at: "desc" },
            where: {},
            skip: 0,
            take: 15,
            include: {
                user: {
                    select: { user_id: true, name: true, role: true, email: true },
                },
            },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            logs: mockLogs,
            total: 1,
            page: 1,
            limit: 15,
        });
    });

    it("should correctly apply filters for action_performed and table_name", async () => {
        mockFindMany.mockResolvedValue(mockLogs);
        mockCount.mockResolvedValue(1);

        const req = { query: { action_performed: "INSERT", table_name: "donor" } };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        const expectedWhere = { action_performed: "INSERT", table_name: "donor" };

        expect(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expectedWhere,
            }),
        );
    });

    it("should correctly apply date range filters", async () => {
        mockFindMany.mockResolvedValue(mockLogs);
        mockCount.mockResolvedValue(1);

        const startDateStr = "2023-01-01";
        const endDateStr = "2023-12-31";

        const req = { query: { start_date: startDateStr, end_date: endDateStr } };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        const expectedWhere = {
            performed_at: {
                gte: new Date(startDateStr),
                lte: new Date(endDateStr),
            },
        };

        expect(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expectedWhere,
            }),
        );
    });

    it("should correctly apply modified_by filter", async () => {
        mockFindMany.mockResolvedValue(mockLogs);
        mockCount.mockResolvedValue(1);

        const req = { query: { modified_by: "Staff" } };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        const expectedWhere = {
            user: {
                name: {
                    contains: "Staff",
                    mode: "insensitive",
                },
            },
        };

        expect(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expectedWhere,
            }),
        );
    });

    it("should correctly apply custom pagination", async () => {
        mockFindMany.mockResolvedValue(mockLogs);
        mockCount.mockResolvedValue(20);

        const req = { query: { page: "2", limit: "5" } };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 5,
                take: 5,
            }),
        );
        expect(res.json).toHaveBeenCalledWith({
            logs: mockLogs,
            total: 20,
            page: 2,
            limit: 5,
        });
    });

    it("should return 200 with empty array if no logs", async () => {
        mockFindMany.mockResolvedValue([]);
        mockCount.mockResolvedValue(0);

        const req = { query: {} };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            logs: [],
            total: 0,
            page: 1,
            limit: 15,
        });
    });

    it("should return 500 if service throws an error", async () => {
        mockFindMany.mockRejectedValue(new Error("Database error"));

        const req = { query: {} };
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
});
