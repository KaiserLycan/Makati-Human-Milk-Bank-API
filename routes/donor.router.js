import express from 'express';
import {ProtectRoute} from "../middleware/auth.middleware.js";
import {
    DeleteDonor,
    GetDonor,
    GetDonors,
    RegisterDonor,
    UpdateApplicationStatus, UpdateDonor
} from "../controllers/donor.contoller.js";

const router = express.Router();

router.get("/", ProtectRoute, GetDonors);
router.get("/:dtn", ProtectRoute, GetDonor);
router.post("/register", ProtectRoute, RegisterDonor);
router.post("/public-register", RegisterDonor);
router.patch("/:dtn", ProtectRoute, UpdateApplicationStatus)
router.delete("/:dtn", ProtectRoute, DeleteDonor);
router.put("/:dtn", ProtectRoute, UpdateDonor);



export default router;