import { prisma } from "../db/db.ts";
import { createUser, updatePassword, updateUserStatus } from "../service/user.service.js";
import { ValidateCredentials } from "../service/auth.service.js";

export const addUser = async (req, res) => {
    try {
        const { name, role, email, phone, password } = req.body;
        const modified_by = req.user.user_id;
        const newUser = await createUser({ name, role, email, phone, password, modified_by });
        return res.status(201).json(newUser);
    } catch (error) {
        if (error.code === "P2002") return res.status(400).json({ error: "Email already exists." });
        console.log("Error in CreateUser controller");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const user_id = req.user.user_id;

        await ValidateCredentials({ user_id, password: old_password });
        await updatePassword({ password: new_password, user_id, modified_by: user_id });
        return res.status(200).json({ message: "Password has been changed." });
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "Cannot find user." });
        console.log("Error in ResetPasswordController");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { new_password } = req.body;
        const { user_id } = req.params;
        const modified_by = req.user.user_id;

        await updatePassword({ password: new_password, user_id, modified_by });
        return res.status(200).json({ message: "Password has been reset." });
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "User does not exist." });
        console.log("Error in ResetPasswordController");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deactivateUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const modified_by = req.user.user_id;
        const updatedUser = await updateUserStatus({
            user_id,
            status: "inactive",
            modified_by: modified_by,
        });

        return res.status(200).json(updatedUser);
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "User not found" });
        console.log("Error in DeactivateUserController");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
