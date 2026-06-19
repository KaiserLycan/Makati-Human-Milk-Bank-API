import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    removeDonor,
    viewDonorProfile,
    queryDonors,
    registerDonor,
    updateDonorInformation,
    approveDonor,
    rejectDonor,
    toggleDonorStatus,
} from "../controllers/donor.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { donorQuerySchema, donorSchemas } from "../schemas/donor.schemas.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { parseFormDataJson } from "../middleware/parseFormatData.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

router.get("/", protectRoute, validateRequest({ query: donorQuerySchema }), queryDonors);

router.get("/:dtn", protectRoute, validateRequest({ params: IdSchema }), viewDonorProfile);

router.post(
    "/register",
    protectRoute,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchemas }),
    registerDonor,
);

router.post(
    "/public-register",
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchemas }),
    registerDonor,
);

router.put(
    "/:dtn",
    protectRoute,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchemas, params: IdSchema }),
    updateDonorInformation,
);

router.patch("/approve/:dtn", protectRoute, validateRequest({ params: IdSchema }), approveDonor);

router.patch("/reject/:dtn", protectRoute, validateRequest({ params: IdSchema }), rejectDonor);

router.patch(
    "/toggle-status/:dtn",
    protectRoute,
    validateRequest({ params: IdSchema }),
    toggleDonorStatus,
);

router.delete("/:dtn", protectRoute, validateRequest({ params: IdSchema }), removeDonor);

export default router;
