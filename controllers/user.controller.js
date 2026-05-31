import {prisma} from "../db/db.ts";
import {ComparePassword, HashPassword} from "../utils/password.util.js";

export const CreateUser = async (req, res) => {
    try {
        const {name, email, phone, password} = req.body;

        const password_hash = await HashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: password_hash,
                modified_by: req.user.user_id,
            }
        })

        return res.status(201).json({user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status})
    }
    catch(error) {
        if (error.code === "P2002") return res.status(400).json({ error: "Email already exists." });
        console.log("Error in CreateUser controller");
        console.log(error)
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const ChangePassword = async (req, res) => {
    try {
        const {old_password, new_password} = req.body;

        const user = await prisma.user.findUniqueOrThrow({
            where: {
                user_id: req.user.user_id,
            }
        })

        const is_valid_password = await ComparePassword(old_password, user.password);
        if(!is_valid_password) return res.status(401).json({error: "Old password does not match current password."});

        const hashed_password = await HashPassword(new_password);

        await prisma.user.update({
            data: {
                password: hashed_password,
            },
            where: {
                user_id: req.user.user_id,
            }
        })

        return res.status(200).json({message: "Password updated successfully."});
    }
    catch(error) {
        if (error.code === "P2025") return res.status(404).json({error: "Cannot find user."});
        console.log("Error in ResetPasswordController");
        console.log(error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}