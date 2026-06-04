import express from 'express';
import {ProtectRoute} from "../middleware/auth.middleware.js";
import {
    DeleteBeneficiary,
    GetBeneficiaries,
    GetBeneficiary,
    RegisterBeneficiary, UpdateApplicationStatus,
    UpdateBeneficiary
} from "../controllers/beneficiary.controller.js";

const router = express.Router();

router.get("/", ProtectRoute, GetBeneficiaries);
router.get("/:bid", ProtectRoute, GetBeneficiary);
router.post("/register", ProtectRoute, RegisterBeneficiary);
router.post("/public-register", RegisterBeneficiary);
router.patch("/:bid", ProtectRoute, UpdateApplicationStatus);
router.delete("/:bid", ProtectRoute, DeleteBeneficiary);
router.put("/:bid", ProtectRoute, UpdateBeneficiary);

export default router;