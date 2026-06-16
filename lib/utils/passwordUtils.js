import bcrypt from "bcryptjs";

export const HashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const ComparePassword = async (password, hash_password) => {
    return await bcrypt.compare(password, hash_password);
};
