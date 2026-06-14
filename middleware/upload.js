import multer from "multer";
import { AppError } from "../utils/appError.js";
const storage = multer.memoryStorage();

export const uploadSingleImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new AppError("Only image files are allowed", 400), false);
    },
}).single("profile_image_url");

export const uploadBeneficiaryProfile = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new AppError("Only image files are allowed", 400), false);
    },
}).fields([
    { name: "profile_image_url", maxCount: 1 },
    { name: "prescription_details", maxCount: 1 },
    { name: "clinical_abstract", maxCount: 1 },
]);
