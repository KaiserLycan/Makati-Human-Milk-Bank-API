import express from 'express';
import {ChangePassword, CreateUser} from "../controllers/user.controller.js";
import Validate from "../utils/validate.util.js";
import {UserSchemaValidator} from "../utils/validators/user.validate.js";
import {ProtectRoute} from "../middleware/auth.middleware.js";
import {Authorize} from "../middleware/authorize.middleware.js";
import {PasswordSchemaValidator} from "../utils/validators/password.validate.js";

const router = express.Router();

/**
 * @openapi
 * /api/users/create:
 *   post:
 *     summary: Create a new user
 *     tags:
 *      - User Management
 *     description: Creates a new user with the provided details.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                  email:
 *                      type: string
 *                      format: email
 *                  phone:
 *                      type: string
 *                      default: "09786458976"
 *                  password:
 *                      type: string
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Invalid user data.
 *       401:
 *         description: Unauthorized.
 */
router.post("/create", ProtectRoute, Authorize, Validate(UserSchemaValidator), CreateUser)
router.patch("/change-password", ProtectRoute, Validate(PasswordSchemaValidator), ChangePassword)

/**
 * @openapi
 * /api/users/change-password:
 *   patch:
 *     summary: Change user password
 *     tags:
 *      - User Management
 *     description: Allows an authenticated user to change their password.
 *     security:
 *       - bearerAuth: []
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
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 */
router.patch("/change-password", ProtectRoute, Validate(PasswordSchemaValidator), ChangePassword)

export default router;