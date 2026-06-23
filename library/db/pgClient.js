import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const createPgClient = () => {
    return new Client({
        connectionString: process.env.DIRECT_DATABASE_URL,
    });
};
