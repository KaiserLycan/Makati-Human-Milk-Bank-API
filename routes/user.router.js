import express from "express";
import {
    changePassword,
    addUser,
    deactivateUser,
    resetPassword,
} from "../controllers/user.controller.js";
import Validate from "../utils/validate.util.js";
import { UserSchemaValidator } from "../utils/validators/user.validate.js";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/authorize.middleware.js";
import { PasswordSchemaValidator } from "../utils/validators/password.validate.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: API for managing user accounts
 */

/**
 * @swagger
 * /api/users/create:
 *   post:
 *     summary: Create a new user
 *     tags: [User Management]
 *     description: Creates a new user with the provided details. Requires manager privileges.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 example: "09123456789"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Invalid user data provided.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.post("/create", ProtectRoute, Authorize, Validate(UserSchemaValidator), addUser);

/**
 * @swagger
 * /api/users/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [User Management]
 *     description: Allows an authenticated user to change their own password.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Invalid request (e.g., incorrect current password).
 *       401:
 *         description: Unauthorized.
 */
router.patch("/change-password", ProtectRoute, Validate(PasswordSchemaValidator), changePassword);

/**
 * @swagger
 * /api/users/{user_id}/reset-password:
 *   patch:
 *     summary: Reset a user's password
 *     tags: [User Management]
 *     description: Allows a manager to reset the password for a specific user account without needing the current password.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: The UUID of the user account.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found.
 */
router.patch("/reset-password/:user_id", ProtectRoute, Authorize, resetPassword);

/**
 * @swagger
 * /api/users/{user_id}/deactivate:
 *   patch:
 *     summary: Deactivate a user account
 *     tags: [User Management]
 *     description: Allows a manager to deactivate a user's account, preventing them from logging in.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: The UUID of the user account to deactivate.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found.
 */
router.patch("/deactivate/:user_id", ProtectRoute, Authorize, deactivateUser);

export default router;
