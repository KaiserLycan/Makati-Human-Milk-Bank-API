import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    queryBeneficiaries,
    viewBeneficiaryProfile,
    registerBeneficiary,
    updateBeneficiaryInformation,
    approveBeneficiary,
    rejectBeneficiary,
    toggleBeneficiaryStatus,
    removeBeneficiary,
} from "../controllers/beneficiary.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { beneficiaryQuerySchema, beneficiarySchemas } from "../schemas/beneficiary.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";
import { uploadBeneficiaryProfile } from "../middleware/upload.js";
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
    validateRequest({ body: beneficiarySchemas }),
    registerBeneficiary,
);

router.post(
    "/public-register",
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ body: beneficiarySchemas }),
    registerBeneficiary,
);

router.put(
    "/:bid",
    protectRoute,
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ body: beneficiarySchemas, params: IdSchema }),
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
    "/toggle-status/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    toggleBeneficiaryStatus,
);

router.delete("/:bid", protectRoute, validateRequest({ params: IdSchema }), removeBeneficiary);

export default router;
