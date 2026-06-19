import express from "express";
import { login, logout } from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/login", login);

router.post("/logout", protectRoute, logout);

export default router;
