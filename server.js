import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import Swagger from "./lib/swagger.lib.js"

dotenv.config();

import UserRouter from "./routes/user.router.js";
import AuthRouter from "./routes/auth.router.js";
import AuditLogRouter from "./routes/auditLog.router.js";
import DonorRouter from "./routes/donor.router.js";
import PrePoolRouter from "./routes/prepool.router.js";
import CollectionRouter from "./routes/collection.router.js";
import BeneficiaryRouter from "./routes/beneficiary.router.js";

import EmailService from "./lib/nodemailer.lib.js";

const port = process.env.PORT || 5000;
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

Swagger(app, port)

app.use("/api/auth", AuthRouter);
app.use("/api/users", UserRouter);
app.use("/api/audit-logs", AuditLogRouter);
app.use("/api/donors", DonorRouter);
app.use("/api/prepool", PrePoolRouter);
app.use("/api/collections", CollectionRouter);
app.use("/api/beneficiaries", BeneficiaryRouter)

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})