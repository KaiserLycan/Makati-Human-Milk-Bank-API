
import express from "express";;
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

import UserRouter from "./routes/user.router.js";
import AuthRouter from "./routes/auth.router.js";

const port = process.env.PORT || 5000;
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", AuthRouter);
app.use("/api/users", UserRouter);

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})