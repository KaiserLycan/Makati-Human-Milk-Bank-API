import express from 'express';
import {CreateUser} from "../controllers/user.controller.js";
import Validate from "../utils/validate.util.js";
import {UserSchemaValidator} from "../utils/validators/user.validate.js";
import {ProtectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", ProtectRoute, Validate(UserSchemaValidator), CreateUser)

export default router;