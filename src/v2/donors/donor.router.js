import express from "express";
import { protectRoute } from "../../middleware/protectRoute.js";
import {
    removeDonor,
    viewDonorProfile,
    queryDonors,
    registerDonor,
    updateDonorInformation,
    approveDonor,
    rejectDonor,
    activateDonor,
    deactivateDonor,
} from "./donor.contoller.js";
import { validateRequest } from "../../middleware/validate.js";
import { donorQuerySchema, donorSchema } from "./donor.schema.js";
import { uploadSingleImage } from "../../middleware/upload.js";
import { parseFormDataJson } from "../../middleware/parseFormatData.js";
import { IdSchema } from "../../shared/schemas/idSchemas.js";

const router = express.Router();

router.get("/", protectRoute, validateRequest({ query: donorQuerySchema }), queryDonors);

router.get("/:dtn", protectRoute, validateRequest({ params: IdSchema }), viewDonorProfile);

router.post(
    "/register",
    protectRoute,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchema }),
    registerDonor,
);

router.post(
    "/public-register",
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchema }),
    registerDonor,
);

router.put(
    "/:dtn",
    protectRoute,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchema, params: IdSchema }),
    updateDonorInformation,
);

router.patch("/approve/:dtn", protectRoute, validateRequest({ params: IdSchema }), approveDonor);

router.patch("/reject/:dtn", protectRoute, validateRequest({ params: IdSchema }), rejectDonor);

router.patch("/activate/:dtn", protectRoute, validateRequest({ params: IdSchema }), activateDonor);

router.patch(
    "/deactivate/:dtn",
    protectRoute,
    validateRequest({ params: IdSchema }),
    deactivateDonor,
);

router.delete("/:dtn", protectRoute, validateRequest({ params: IdSchema }), removeDonor);

export default router;
