import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {prisma} from "./src/db.ts";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})