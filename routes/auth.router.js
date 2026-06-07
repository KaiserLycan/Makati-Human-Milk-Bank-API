import express from 'express';
import {Authenticate, RefreshAccessToken, Logout} from "../controllers/auth.controller.js";
import {ProtectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate users
 *     tags: [Authentication]
 *     description: Returns an access token, refresh token, and user profile information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SuperSecretPassword123
 *     responses:
 *       200:
 *         description: Successful authentication.
 *       401:
 *         description: Invalid email or password.
 */
router.post("/login", Authenticate)

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Obtains a new access token using a refresh token.
 *     responses:
 *       200:
 *         description: New access token generated.
 *       401:
 *         description: Unauthorized.
 */
router.post("/refresh-token", RefreshAccessToken)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Invalidates the user's refresh token.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *       401:
 *         description: Unauthorized.
 */
router.post("/logout", ProtectRoute, Logout)

export default router;