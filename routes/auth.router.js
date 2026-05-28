import express from 'express';
import {Authenticate} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", Authenticate)

export default router;