import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Authorize } from '../../middleware/authorize.middleware.js';

// Helper to create a test app with a mock user (simulating ProtectRoute already ran)
const createApp = (mockUser = null) => {
    const app = express();
    app.use(express.json());

    // Simulate ProtectRoute setting req.user
    app.use((req, res, next) => {
        req.user = mockUser;
        next();
    });

    // Test routes
    app.get('/manager-only', Authorize('manager'), (req, res) => {
        res.status(200).json({ success: true, message: 'Manager access granted' });
    });

    app.get('/staff-only', Authorize('staff'), (req, res) => {
        res.status(200).json({ success: true, message: 'Staff access granted' });
    });

    app.get('/both-roles', Authorize('manager', 'staff'), (req, res) => {
        res.status(200).json({ success: true, message: 'Access granted for both roles' });
    });

    return app;
};

// ─── Authorize integration tests ──────────────────────────────────────

describe('Authorize middleware (integration)', () => {

    it('should return 200 if manager accesses manager-only route', async () => {
        const app = createApp({ user_id: 'uuid-001', role: 'manager' });
        const res = await request(app).get('/manager-only');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 403 if staff accesses manager-only route', async () => {
        const app = createApp({ user_id: 'uuid-002', role: 'staff' });
        const res = await request(app).get('/manager-only');

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Forbidden. You do not have permission to access this resource.');
    });

    it('should return 200 if staff accesses staff-only route', async () => {
        const app = createApp({ user_id: 'uuid-002', role: 'staff' });
        const res = await request(app).get('/staff-only');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 403 if manager accesses staff-only route', async () => {
        const app = createApp({ user_id: 'uuid-001', role: 'manager' });
        const res = await request(app).get('/staff-only');

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Forbidden. You do not have permission to access this resource.');
    });

    it('should return 200 if staff accesses both-roles route', async () => {
        const app = createApp({ user_id: 'uuid-002', role: 'staff' });
        const res = await request(app).get('/both-roles');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 200 if manager accesses both-roles route', async () => {
        const app = createApp({ user_id: 'uuid-001', role: 'manager' });
        const res = await request(app).get('/both-roles');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 401 if req.user is missing', async () => {
        const app = createApp(null);
        const res = await request(app).get('/manager-only');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Unauthorized. Please log in.');
    });

});