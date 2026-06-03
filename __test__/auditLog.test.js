const { describe, it, expect, beforeEach } = require('@jest/globals');

const mockFindMany = jest.fn();

jest.mock('../db/db.ts', () => ({
    prisma: {
        audit_log: {
            findMany: (...args) => mockFindMany(...args)
        }
    }
}));

const { FetchAuditLogs } = require('../controllers/auditLog.controller.js');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('FetchAuditLogs controller', () => {

    beforeEach(() => {
        mockFindMany.mockReset();
    });

    it('should return 200 with audit logs', async () => {
        const mockLogs = [
            {
                log_id: 1,
                modified_by: 'uuid-001',
                action_performed: 'INSERT',
                table_name: 'donor',
                old_data: null,
                new_data: { name: 'Test Donor' },
                performed_at: new Date(),
                user: { user_id: 'uuid-001', name: 'Staff One', role: 'staff', email: 'staff@test.com' }
            }
        ];

        mockFindMany.mockResolvedValue(mockLogs);

        const req = {};
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockLogs
        });
    });

    it('should return 200 with empty array if no logs', async () => {
        mockFindMany.mockResolvedValue([]);

        const req = {};
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: []
        });
    });

    it('should return 500 if service throws an error', async () => {
        mockFindMany.mockRejectedValue(new Error('Database error'));

        const req = {};
        const res = mockRes();

        await FetchAuditLogs(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Internal server error'
        });
    });

});