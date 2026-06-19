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
import {
    changePasswordSchemas,
    userSchema,
    updatePasswordSchemas,
    updateUserSchemas,
    userIDSchema,
    usersQuery,
} from "../schemas/user.schema.js";
import { uploadSingleImage } from "../middleware/upload.js";

const router = express.Router();

router.get("/", protectRoute, authorize, validateRequest({ query: usersQuery }), getUsers);

router.get("/profile", protectRoute, getProfile);

router.get(
    "/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    getUser,
);

router.post(
    "/",
    protectRoute,
    authorize,
    uploadSingleImage,
    validateRequest({ body: userSchema }),
    createUser,
);

router.put(
    "/:user_id",
    protectRoute,
    authorize,
    uploadSingleImage,
    validateRequest({ body: updateUserSchemas, params: userIDSchema }),
    updateUser,
);

router.patch(
    "/status/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    toggleUserStatus,
);

router.patch(
    "/change-password",
    protectRoute,
    validateRequest({ body: changePasswordSchemas }),
    changePassword,
);

router.patch(
    "/reset-password/:user_id",
    protectRoute,
    authorize,
    validateRequest({ body: updatePasswordSchemas, params: userIDSchema }),
    resetPassword,
);

router.delete(
    "/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    removeUser,
);

export default router;
