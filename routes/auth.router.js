import express from 'express';
import {Authenticate, RefreshAccessToken} from "../controllers/auth.controller.js";
import {ProtectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", Authenticate)
router.post("/refresh-token", RefreshAccessToken)

export default router;