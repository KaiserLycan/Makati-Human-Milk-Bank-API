import express from 'express';
import {ChangePassword, CreateUser} from "../controllers/user.controller.js";
import Validate from "../utils/validate.util.js";
import {UserSchemaValidator} from "../utils/validators/user.validate.js";
import {ProtectRoute} from "../middleware/auth.middleware.js";
import {Authorize} from "../middleware/authorize.middleware.js";
import {PasswordSchemaValidator} from "../utils/validators/password.validate.js";

const router = express.Router();

router.post("/create", ProtectRoute, Authorize, Validate(UserSchemaValidator), CreateUser)
router.patch("/change-password", ProtectRoute, Validate(PasswordSchemaValidator), ChangePassword)

export default router;