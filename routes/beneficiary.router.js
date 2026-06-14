import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    queryBeneficiaries,
    viewBeneficiaryProfile,
    registerBeneficiary,
    updateBeneficiaryInformation,
    approveBeneficiary,
    rejectBeneficiary,
    activateBeneficiary,
    deactivateBeneficiary,
    removeBeneficiary,
} from "../controllers/beneficiary.controller.js";
import { validateRequest } from "../middleware/validate.js";
import { beneficiaryQuerySchema, beneficiarySchema } from "../schemas/BeneficiarySchema.js";
import { IdSchema } from "../schemas/idSchemas.js";
import { uploadBeneficiaryProfile, uploadSingleImage } from "../middleware/upload.js";
import { parseFormDataJson } from "../middleware/parseFormatData.js";
const router = express.Router();

router.get(
    "/",
    protectRoute,
    validateRequest({ query: beneficiaryQuerySchema }),
    queryBeneficiaries,
);

router.get("/:bid", protectRoute, validateRequest({ params: IdSchema }), viewBeneficiaryProfile);

router.post(
    "/register",
    protectRoute,
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ beneficiarySchema }),
    registerBeneficiary,
);

router.post(
    "/public-register",
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ beneficiarySchema }),
    registerBeneficiary,
);

router.put(
    "/:bid",
    protectRoute,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: beneficiarySchema, params: IdSchema }),
    updateBeneficiaryInformation,
);

router.patch(
    "/approve/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    approveBeneficiary,
);

router.patch(
    "/reject/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    rejectBeneficiary,
);

router.patch(
    "/activate/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    activateBeneficiary,
);

router.patch(
    "/deactivate/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    deactivateBeneficiary,
);

router.delete("/:bid", protectRoute, validateRequest({ params: IdSchema }), removeBeneficiary);

export default router;
