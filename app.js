import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import UserRouter from "./routes/user.router.js";
import AuthRouter from "./routes/auth.router.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", UserRouter);
app.use("/api/auth", AuthRouter);

export default app;