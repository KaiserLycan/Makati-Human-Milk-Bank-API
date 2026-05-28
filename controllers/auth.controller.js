import {prisma} from "../db/db.ts";
import {ComparePassword} from "../utils/password.util.js";

export const Authenticate = async (req, res) => {
    try {
        const { user_id, password } = req.body;
        const user = await prisma.user.findUniqueOrThrow({
            where: { user_id },
        })

        if (await ComparePassword(password, user.password_hash)) {
            return res.status(200).json({
                user_id: user.user_id,
                name: user.name,
                email_add: user.email_add,
                phone_num: user.phone_num,
                status: user.status
            })
        }

    }
    catch(error) {
        if (error.code === "P2025") return res.status(404).json({error: "Invalid Credentials"});

        console.log("Error in Authenticate Controller.")
        console.log(error)
        return res.status(500).json({error: "Internal Server Error"});
    }
}