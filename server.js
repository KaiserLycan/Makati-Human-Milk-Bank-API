import express from 'express';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import UserRouter from "./routes/user.router.js"

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/users/", UserRouter)

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})