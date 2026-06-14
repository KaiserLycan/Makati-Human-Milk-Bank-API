import cloudinary from "../lib/cloudinary.lib.js";
import streamifier from "streamifier";
import { AppError } from "../utils/appError.js";

export const uploadImageToCloudinary = (fileBuffer, folderName = "general") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    return reject(new AppError("Failed to upload image to Cloudinary", 500));
                }
                resolve(result);
            },
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

export const uploadBeneficiaryProfileToCloudinary = async (req, profile) => {
    const uploadTasks = [];
    if (req.files?.profile_image_url) {
        const task = uploadImageToCloudinary(
            req.files.profile_image[0].buffer,
            "beneficiary_profile",
        ).then((res) => {
            profile.profile_image_url = res.secure_url;
        });
        uploadTasks.push(task);
    }

    if (req.files?.prescription_details) {
        const task = uploadImageToCloudinary(
            req.files.prescription[0].buffer,
            "prescriptions",
        ).then((res) => {
            profile.prescription_details = res.secure_url;
        });
        uploadTasks.push(task);
    }

    if (req.files?.clinical_abstract) {
        const task = uploadImageToCloudinary(
            req.files.clinical_abstract[0].buffer,
            "abstracts",
        ).then((res) => {
            profile.clinical_abstract = res.secure_url;
        });
        uploadTasks.push(task);
    }

    if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
    }
};
