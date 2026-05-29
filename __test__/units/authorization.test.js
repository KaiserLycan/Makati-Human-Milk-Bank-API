import { describe, it, expect, jest } from '@jest/globals';
import { Authorize } from '../../middleware/authorize.middleware.js';

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ─── Authorize tests ──────────────────────────────────────────────────

describe('Authorize middleware', () => {

    it('should call next() if user role is allowed', () => {
        const req = { user: { user_id: 'uuid-001', role: 'staff' } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('staff')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() if manager role is allowed', () => {
        const req = { user: { user_id: 'uuid-002', role: 'manager' } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('manager')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() if multiple roles allowed and user matches', () => {
        const req = { user: { user_id: 'uuid-001', role: 'staff' } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('manager', 'staff')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
        const req = { user: { user_id: 'uuid-001', role: 'staff' } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('manager')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Forbidden. You do not have permission to access this resource.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if req.user is missing', () => {
        const req = {};
        const res = mockRes();
        const next = jest.fn();

        Authorize('manager')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Unauthorized. Please log in.'
        });
        expect(next).not.toHaveBeenCalled();
    });

});