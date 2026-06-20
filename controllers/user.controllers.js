import {
    registerNewUser,
    deleteUser as deleteUserService,
    fetchUserDetails,
    queryUsers,
    updatePassword as updatePasswordService,
    updateUser as updateUserService,
    toggleUserStatus as toggleUserStatusService,
    validateCredentials,
} from "../services/user.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const getUsers = async (req, res) => {
    const users = await queryUsers(req.query);
    return res.status(200).json(new APIResponse(200, users, "Query successful"));
};

export const getUser = async (req, res) => {
    const { user_id } = req.params;
    const user = await fetchUserDetails(user_id);
    return res.status(200).json(new APIResponse(200, user, "Successfully retrieved user"));
};

export const getProfile = async (req, res) => {
    const { user_id } = req.user;
    const user = await fetchUserDetails(user_id);
    return res.status(200).json(new APIResponse(200, user, "Successfully retrieved user Profile"));
};

export const createUser = async (req, res) => {
    const newUser = await registerNewUser(req);
    return res.status(201).json(new APIResponse(201, newUser, "Successfully added user"));
};

export const updateUser = async (req, res) => {
    const updatedUser = await updateUserService(req);
    return res.status(200).json(new APIResponse(200, updatedUser, "Successfully updated user"));
};

export const changePassword = async (req, res) => {
    const { old_password, new_password } = req.body;
    const { user_id } = req.user;
    await validateCredentials({ user_id, password: old_password });
    await updatePasswordService(user_id, new_password, user_id);
    return res.status(200).json(new APIResponse(200, null, "Password changed successfully"));
};

export const resetPassword = async (req, res) => {
    const { new_password } = req.body;
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    await updatePasswordService(user_id, new_password, modified_by);
    return res.status(200).json(new APIResponse(200, null, "Password changed successfully"));
};

export const toggleUserStatus = async (req, res) => {
    const { user_id } = req.params;
    const modified_by = req.user.user_id;
    const updatedUser = await toggleUserStatusService(user_id, modified_by);
    return res
        .status(200)
        .json(new APIResponse(200, updatedUser, `User status updated to ${updatedUser.status}`));
};

export const removeUser = async (req, res) => {
    const { user_id } = req.params;
    await deleteUserService(user_id);
    return res.status(200).json(new APIResponse(200, null, "User has been successfully deleted"));
};
