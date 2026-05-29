import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { authenticate } from '../../middleware/authenticate.js';
import { Authorize } from '../../middleware/authorize.middleware.js';

// Helper to create a test app with a mock session
const createApp = (sessionUser = null) => {
    const app = express();
    app.use(express.json());

    // Mock session middleware
    app.use((req, res, next) => {
        req.session = sessionUser ? { user: sessionUser } : {};
        next();
    });

    // Test routes
    app.get('/protected', authenticate, (req, res) => {
        res.status(200).json({ success: true, message: 'Access granted' });
    });

    app.get('/manager-only', authenticate, Authorize('manager'), (req, res) => {
        res.status(200).json({ success: true, message: 'Manager access granted' });
    });

    app.get('/staff-only', authenticate, Authorize('staff'), (req, res) => {
        res.status(200).json({ success: true, message: 'Staff access granted' });
    });

    app.get('/both-roles', authenticate, Authorize('manager', 'staff'), (req, res) => {
        res.status(200).json({ success: true, message: 'Access granted for both roles' });
    });

    return app;
};

// ─── authenticate integration tests ──────────────────────────────────

describe('authenticate middleware (integration)', () => {

    it('should return 200 if user is logged in', async () => {
        const app = createApp({ emp_id: 'E001', role: 'staff' });
        const res = await request(app).get('/protected');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 401 if no session user', async () => {
        const app = createApp(null);
        const res = await request(app).get('/protected');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Unauthorized. Please log in.');
    });

});

// ─── authorize integration tests ─────────────────────────────────────

describe('authorize middleware (integration)', () => {

    it('should return 200 if manager accesses manager-only route', async () => {
        const app = createApp({ emp_id: 'E001', role: 'manager' });
        const res = await request(app).get('/manager-only');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 403 if staff accesses manager-only route', async () => {
        const app = createApp({ emp_id: 'E002', role: 'staff' });
        const res = await request(app).get('/manager-only');

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Forbidden. You do not have permission to access this resource.');
    });

    it('should return 200 if staff accesses staff-only route', async () => {
        const app = createApp({ emp_id: 'E002', role: 'staff' });
        const res = await request(app).get('/staff-only');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 403 if manager accesses staff-only route', async () => {
        const app = createApp({ emp_id: 'E001', role: 'manager' });
        const res = await request(app).get('/staff-only');

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Forbidden. You do not have permission to access this resource.');
    });

    it('should return 200 if staff accesses both-roles route', async () => {
        const app = createApp({ emp_id: 'E002', role: 'staff' });
        const res = await request(app).get('/both-roles');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 200 if manager accesses both-roles route', async () => {
        const app = createApp({ emp_id: 'E001', role: 'manager' });
        const res = await request(app).get('/both-roles');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 401 if no session on authorized route', async () => {
        const app = createApp(null);
        const res = await request(app).get('/manager-only');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Unauthorized. Please log in.');
    });

});