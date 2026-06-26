import express from "express";
import { getAuditByID, queryAuditLogs } from "../controllers/audit.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { authorize } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validate.js";
import { queryAuditSchemas } from "../schemas/audit.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Query audit logs
 *     description: Retrieve a list of audit logs with optional filtering and pagination.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve.
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: The number of items to retrieve per page.
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "performed_at"
 *         description: The field to sort by.
 *         example: "performed_at"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         description: The sort order.
 *         example: "desc"
 *       - in: query
 *         name: modified_by
 *         schema:
 *           type: string
 *         description: Filter by the user who performed the action.
 *         example: "admin"
 *       - in: query
 *         name: action_performed
 *         schema:
 *           type: string
 *         description: Filter by the action performed.
 *         example: "CREATE"
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter by the table name.
 *         example: "donors"
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date for the filter range.
 *         example: "2024-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for the filter range.
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: A list of audit logs.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    "/",
    protectRoute,
    authorize,
    validateRequest({
        query: queryAuditSchemas,
    }),
    queryAuditLogs,
);

/**
 * @swagger
 * /api/audit-logs/{log_id}:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit log by ID
 *     description: Retrieve a single audit log by its ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: log_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the audit log to retrieve.
 *         example: 12345
 *     responses:
 *       200:
 *         description: The requested audit log.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found.
 */
router.get(
    "/:log_id",
    protectRoute,
    authorize,
    validateRequest({
        params: IdSchema,
    }),
    getAuditByID,
);

export default router;
