import express from 'express';
import {CreateUser} from "../controllers/user.controller.js";
import Validate from "../utils/validate.util.js";
import {UserSchemaValidator} from "../utils/validators/user.validate.js";

const router = express.Router();

router.post("/", Validate(UserSchemaValidator),CreateUser)

export default router;