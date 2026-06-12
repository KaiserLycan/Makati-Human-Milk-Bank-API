import express from "express";
import { login, logout } from "../controllers/auth.controller.js";
import { ProtectRoute } from "../middleware/auth.middleware.js";

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
 *     summary: Authenticate a user
 *     tags: [Authentication]
 *     description: Authenticates a user with their email and password. On success, it sets httpOnly cookies for access and refresh tokens and returns user information.
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
 *         description: Authentication successful. Returns user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   example: "c6a9b5b0-c2b6-4e0d-8a2b-5a6a8b4c3d2e"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 phone:
 *                   type: string
 *                   example: "123-456-7890"
 *                 role:
 *                   type: string
 *                   example: "user"
 *                 status:
 *                   type: string
 *                   example: "active"
 *       400:
 *         description: Invalid credentials provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid Credentials"
 *       401:
 *         description: Authentication failed, e.g., user account is not active.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Authentication failed"
 *                 description:
 *                   type: string
 *                   example: "User account is no longer active."
 *       500:
 *         description: Internal Server Error.
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     description: Clears the user's session by invalidating their access and refresh tokens and removing them from cookies.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully logged out"
 *       401:
 *         description: Unauthorized. The user is not authenticated.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/logout", ProtectRoute, logout);

export default router;
