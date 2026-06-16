import {
    createUser,
    deleteUser,
    getUser,
    getUsers,
    updatePassword,
    updateUser,
    updateUserStatus,
} from "./user.service.js";
import { ValidateCredentials } from "../auth/auth.service.js";
import { APIResponse } from "../../../lib/utils/apiResponse.js";
import { uploadImageToCloudinary } from "../../shared/service/upload.service.js";

export const queryUsers = async (req, res) => {
    const { role, status, page, limit, search, sortBy, sortOrder } = req.query;
    const users = await getUsers({ status, role, limit, page, search, sortBy, sortOrder });
    return res.status(200).json(new APIResponse(200, users, "Query successful"));
};

export const viewUser = async (req, res) => {
    const { user_id } = req.params;
    const user = await getUser(user_id);
    return res.status(200).json(new APIResponse(200, user, "Successfully retrieved user"));
};

export const viewProfile = async (req, res) => {
    const user_id = req.user.user_id;
    const user = await getUser(user_id);
    return res.status(200).json(new APIResponse(200, user, "Successfully retrieved user Profile"));
};

export const addUser = async (req, res) => {
    const { name, role, email, phone, password } = req.body;
    const modified_by = req.user.user_id;
    let profile_image_url = "";
    if (req.file) {
        const image = await uploadImageToCloudinary(req.file.buffer, "user_profile");
        profile_image_url = image.secure_url;
    }
    const newUser = await createUser({
        name,
        role,
        email,
        phone,
        password,
        modified_by,
        profile_image_url,
    });
    return res.status(201).json(new APIResponse(201, newUser, "Successfully added user"));
};

export const updateUserProfile = async (req, res) => {
    const { name, role, email, phone } = req.body;
    let { profile_image_url } = req.body;
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    if (req.file) {
        const image = await uploadImageToCloudinary(req.file.buffer, "user_profile");
        profile_image_url = image.secure_url;
    }
    const updatedUser = await updateUser({
        user_id,
        name,
        role,
        email,
        phone,
        modified_by,
        profile_image_url,
    });
    return res
        .status(201)
        .json(new APIResponse(201, updatedUser, "Successfully updated user profile"));
};

export const changePassword = async (req, res) => {
    const { old_password, new_password } = req.body;
    const user_id = req.user.user_id;
    await ValidateCredentials({ user_id, password: old_password });
    await updatePassword({ password: new_password, user_id, modified_by: user_id });
    return res.status(200).json(new APIResponse(200, null, "Password changed successfully"));
};

export const resetPassword = async (req, res) => {
    const { new_password } = req.body;
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    await updatePassword({ password: new_password, user_id, modified_by });
    return res.status(200).json(new APIResponse(200, null, "Password changed successfully"));
};

export const deactivateUser = async (req, res) => {
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    const updatedUser = await updateUserStatus({
        user_id,
        status: "inactive",
        modified_by: modified_by,
    });
    return res.status(200).json(new APIResponse(200, updatedUser, "Successfully deactivated user"));
};

export const activateUser = async (req, res) => {
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    const updatedUser = await updateUserStatus({
        user_id,
        status: "active",
        modified_by: modified_by,
    });
    return res.status(200).json(new APIResponse(200, updatedUser, "Successfully activated user"));
};

export const removeUser = async (req, res) => {
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    await deleteUser({ user_id, modified_by });
    return res.status(200).json(new APIResponse(200, null, "User has been successfully deleted"));
};
