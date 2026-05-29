import { describe, it, expect, jest } from '@jest/globals';
import { authenticate } from '../../middleware/authenticate.js';
import { Authorize } from '../../middleware/authorize.middleware.js';

// Helper to create mock req, res, next
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// ─── authenticate tests ───────────────────────────────────────────────

describe('authenticate middleware', () => {

    it('should call next() if session and user exist', () => {
        const req = { session: { user: { emp_id: 'E001', role: 'staff' } } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if session is missing', () => {
        const req = {};
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Unauthorized. Please log in.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if session exists but user is missing', () => {
        const req = { session: {} };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Unauthorized. Please log in.'
        });
        expect(next).not.toHaveBeenCalled();
    });

});

// ─── authorize tests ──────────────────────────────────────────────────

describe('authorize middleware', () => {

    it('should call next() if user role is allowed', () => {
        const req = { session: { user: { emp_id: 'E001', role: 'staff' } } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('staff')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() if user is manager and manager is allowed', () => {
        const req = { session: { user: { emp_id: 'E002', role: 'manager' } } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('manager')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() if multiple roles are allowed and user matches', () => {
        const req = { session: { user: { emp_id: 'E001', role: 'staff' } } };
        const res = mockRes();
        const next = jest.fn();

        Authorize('manager', 'staff')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
        const req = { session: { user: { emp_id: 'E001', role: 'staff' } } };
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

    it('should return 401 if session is missing', () => {
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

    it('should return 401 if session exists but user is missing', () => {
        const req = { session: {} };
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