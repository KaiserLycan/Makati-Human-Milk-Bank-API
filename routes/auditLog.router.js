import express from 'express';
import { FetchAuditLogs } from '../controllers/auditLog.controller.js';
import { ProtectRoute } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/authorize.middleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/audit-logs:
 *   get:
 *     summary: Get all audit logs
 *     tags:
 *       - Audit Logs
 *     description: Returns all audit logs. Accessible by managers only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. Managers only.
 *       500:
 *         description: Internal server error.
 */
router.get('/', ProtectRoute, Authorize('manager'), FetchAuditLogs);

export default router;