import express from 'express';
import {ChangePassword, CreateUser, DeactivateUser, ResetPassword} from "../controllers/user.controller.js";
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

/**
 * @openapi
 * /api/users/change-password:
 *   patch:
 *     summary: Change user password
 *     tags:
 *      - User Management
 *     description: Allows an authenticated user to change their password.
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
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 */
router.patch("/change-password", ProtectRoute, Validate(PasswordSchemaValidator), ChangePassword)

/**
 * @openapi
 * /api/users/{user_id}/reset-password:
 *   patch:
 *     summary: Reset user password.
 *     tags:
 *       - User Management
 *     description: Managers can set user password to default/any, when user forgets their password. They are not required to input the old/current password.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: The unique identifier of the user whose password needs resetting.
 *         schema:
 *           type: string
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
 *         description: Password updated successfully.
 *       400:
 *         description: User and password is not specified.
 *       401:
 *         description: Missing Token or Invalid Token.
 *       403:
 *         description: Forbidden. You do not have permission to access this resource.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error or Cannot update user.
 */
router.patch("/:user_id/reset-password", ProtectRoute, Authorize, ResetPassword);


router.patch("/:user_id/deactivate", ProtectRoute, Authorize, DeactivateUser);
export default router;