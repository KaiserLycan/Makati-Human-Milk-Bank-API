import {prisma} from "../db/db.ts";
import {HashPassword} from "../utils/password.util.js";

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

        return res.status(201).json({id: user.user_id, name: user.name, email: user.email, phone_num: user.phone, role: user.role, account_status: user.status})
    }
    catch(error) {
        if (error.code === "P2002") return res.status(400).json({ error: "Email or Phone Number already exists." });
        console.log("Error in CreateUser controller");
        console.log(error)
        return res.status(500).json({error: "Internal Server Error"})
    }
}