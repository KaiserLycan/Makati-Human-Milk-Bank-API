import express from 'express';
import { FetchAuditLogs } from '../controllers/auditLog.controller.js';
import { ProtectRoute } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/authorize.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: API for retrieving audit logs
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get all audit logs
 *     tags: [Audit Logs]
 *     description: Returns a paginated list of audit logs with a total count. Accessible by managers only.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: modified_by
 *         schema:
 *           type: string
 *         description: Filter logs by the name of the user who performed the action (case-insensitive, partial match)
 *       - in: query
 *         name: action_performed
 *         schema:
 *           type: string
 *         description: Filter logs by the type of action performed (e.g., INSERT, UPDATE, DELETE)
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter logs by the name of the affected table
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs performed after this date and time (inclusive)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs performed before this date and time (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: The number of items to return per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. Managers only.
 *       500:
 *         description: Internal server error.
 */
router.get('/', ProtectRoute, Authorize, FetchAuditLogs);

export default router;