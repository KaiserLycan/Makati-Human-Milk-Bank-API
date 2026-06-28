import express from "express";
import {
    changePassword,
    createUser,
    resetPassword,
    getUsers,
    getUser,
    getProfile,
    updateUser,
    removeUser,
    toggleUserStatus,
} from "../controllers/user.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { authorize } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validate.js";
import { AppError } from "../library/classes/AppError.js";
import {
    changePasswordSchemas,
    userSchema,
    updatePasswordSchemas,
    updateUserSchemas,
    userIDSchema,
    usersQuery,
} from "../schemas/user.schema.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         role:
 *           type: string
 *           enum: [manager, staff]
 *           example: "staff"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         profile_image_url:
 *           type: string
 *           format: url
 *           example: "http://example.com/profile.jpg"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *     UpdateUser:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         role:
 *           type: string
 *           enum: [manager, staff]
 *           example: "staff"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         profile_image_url:
 *           type: string
 *           format: url
 *           example: "http://example.com/profile.jpg"
 *     ChangePassword:
 *       type: object
 *       properties:
 *         old_password:
 *           type: string
 *           format: password
 *           example: "old_password"
 *         new_password:
 *           type: string
 *           format: password
 *           example: "new_password"
 *     ResetPassword:
 *       type: object
 *       properties:
 *         new_password:
 *           type: string
 *           format: password
 *           example: "new_password"
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get all users
 *     description: Retrieve a list of all users with optional filtering and pagination.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "created_at"
 *         example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         example: "asc"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: "John"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [manager, staff]
 *         example: "staff"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           default: "active"
 *         example: "active"
 *     responses:
 *       200:
 *         description: A list of users.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get("/", protectRoute, authorize, validateRequest({ query: usersQuery }), getUsers);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get user profile
 *     description: Retrieve the profile of the currently authenticated user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The user's profile.
 *       401:
 *         description: Unauthorized.
 */
router.get("/profile", protectRoute, getProfile);

/**
 * @swagger
 * /api/users/{user_id}:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get a single user
 *     description: Retrieve a single user by their ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *     responses:
 *       200:
 *         description: The user.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found.
 */
router.get(
    "/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    getUser,
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Create a new user
 *     description: Create a new user.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"John Doe","role":"staff","email":"john.doe@example.com","phone":"+1234567890","password":"password123"}'
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.post(
    "/",
    protectRoute,
    authorize,
    strictLimiter,
    uploadSingleImage,
    validateRequest({ body: userSchema }),
    createUser,
);

/**
 * @swagger
 * /api/users/{user_id}:
 *   put:
 *     tags:
 *       - User Management
 *     summary: Update a user
 *     description: Update a user's information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"John Doe","role":"staff","email":"john.doe@example.com","phone":"+1234567890"}'
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found.
 */
const authorizeSelfOrManager = (req, res, next) => {
    if (req.user && (req.user.role === "manager" || req.user.user_id === req.params.user_id)) {
        if (req.user.role !== "manager" && req.body) {
            delete req.body.role;
            delete req.body.status;
        }
        return next();
    }
    throw new AppError("You don't have permission to use this action.", 403);
};

router.put(
    "/:user_id",
    protectRoute,
    authorizeSelfOrManager,
    uploadSingleImage,
    validateRequest({ body: updateUserSchemas, params: userIDSchema }),
    updateUser,
);

/**
 * @swagger
 * /api/users/status/{user_id}:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Toggle user status
 *     description: Toggle a user's active status.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *     responses:
 *       200:
 *         description: User status toggled successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/status/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    toggleUserStatus,
);

/**
 * @swagger
 * /api/users/change-password:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Change password
 *     description: Change the password of the currently authenticated user.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.patch(
    "/change-password",
    protectRoute,
    validateRequest({ body: changePasswordSchemas }),
    changePassword,
);

/**
 * @swagger
 * /api/users/reset-password/{user_id}:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Reset password
 *     description: Reset a user's password.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/reset-password/:user_id",
    protectRoute,
    authorize,
    validateRequest({ body: updatePasswordSchemas, params: userIDSchema }),
    resetPassword,
);

/**
 * @swagger
 * /api/users/{user_id}:
 *   delete:
 *     tags:
 *       - User Management
 *     summary: Remove a user
 *     description: Remove a user from the system.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *     responses:
 *       200:
 *         description: User removed successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found.
 */
router.delete(
    "/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    removeUser,
);

export default router;
