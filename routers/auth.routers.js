import express from "express";
import { login, logout } from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login a user
 *     description: Authenticate a user and receive a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in.
 *       401:
 *         description: Invalid credentials.
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout a user
 *     description: Log out the currently authenticated user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out.
 *       401:
 *         description: Unauthorized.
 */
router.post("/logout", protectRoute, logout);

export default router;
