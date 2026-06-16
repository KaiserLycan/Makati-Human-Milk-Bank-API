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

const deleteImageFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;
    try {
        const urlParts = imageUrl.split("/");
        const publicIdWithExtension = urlParts.slice(-2).join("/");
        const publicId = publicIdWithExtension.split(".")[0];
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Failed to delete image from Cloudinary:", error);
    }
};

export const uploadDonorProfileToCloudinary = async (req, profile, existingProfile) => {
    const uploadTasks = [];

    if (req.files?.profile_image_url?.[0]) {
        if (existingProfile?.personal_information?.profile_image_url) {
            await deleteImageFromCloudinary(existingProfile.personal_information.profile_image_url);
        }
        const task = uploadImageToCloudinary(
            req.files.profile_image_url[0].buffer,
            "donor_profile",
        ).then((res) => {
            profile.personal_information.profile_image_url = res.secure_url;
        });
        uploadTasks.push(task);
    }

    if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
    }
};

export const uploadBeneficiaryProfileToCloudinary = async (req, profile, existingProfile) => {
    const uploadTasks = [];

    if (req.files?.profile_image_url?.[0]) {
        if (existingProfile?.profile_image_url) {
            await deleteImageFromCloudinary(existingProfile.profile_image_url);
        }
        const task = uploadImageToCloudinary(
            req.files.profile_image_url[0].buffer,
            "beneficiary_profile",
        ).then((res) => {
            profile.profile_image_url = res.secure_url;
        });
        uploadTasks.push(task);
    }

    if (req.files?.prescription_details?.[0]) {
        if (existingProfile?.prescription_details) {
            await deleteImageFromCloudinary(existingProfile.prescription_details);
        }
        const task = uploadImageToCloudinary(
            req.files.prescription_details[0].buffer,
            "prescriptions",
        ).then((res) => {
            profile.prescription_details = res.secure_url;
        });
        uploadTasks.push(task);
    }

    if (req.files?.clinical_abstract?.[0]) {
        if (existingProfile?.clinical_abstract) {
            await deleteImageFromCloudinary(existingProfile.clinical_abstract);
        }
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
