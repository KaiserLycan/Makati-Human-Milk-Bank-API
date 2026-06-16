import express from "express";
import {
    changePassword,
    addUser,
    deactivateUser,
    resetPassword,
    activateUser,
    queryUsers,
    viewUser,
    viewProfile,
    updateUserProfile,
    removeUser,
} from "./user.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.js";
import {
    changePasswordSchemas,
    userSchema,
    updatePasswordSchemas,
    updateUserSchemas,
    userIDSchema,
    usersQuery,
} from "./user.schema.js";
import { uploadSingleImage } from "../../middleware/upload.js";

const router = express.Router();

router.get("/", protectRoute, validateRequest({ query: usersQuery }), authorize, queryUsers);

router.get("/profile", protectRoute, viewProfile);

router.get(
    "/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    viewUser,
);

router.post(
    "/",
    protectRoute,
    authorize,
    uploadSingleImage,
    validateRequest({ body: userSchema }),
    addUser,
);

router.put(
    "/:user_id",
    protectRoute,
    authorize,
    uploadSingleImage,
    validateRequest({ body: updateUserSchemas, params: userIDSchema }),
    updateUserProfile,
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

router.patch(
    "/deactivate/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    deactivateUser,
);

router.patch(
    "/activate/:user_id",
    protectRoute,
    authorize,
    validateRequest({
        params: userIDSchema,
    }),
    activateUser,
);

router.delete(
    "/:user_id",
    protectRoute,
    authorize,
    validateRequest({ params: userIDSchema }),
    removeUser,
);

export default router;
