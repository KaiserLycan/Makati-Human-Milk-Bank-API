import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import Swagger from "./config/swagger.lib.js";
import morgan from "morgan";

dotenv.config();

import UserRouter from "./src/v2/users/user.router.js";
import AuthRouter from "./src/v2/auth/auth.router.js";
import PoolingRouter from "./src/v2/processing/pooling.router.js";
import AuditLogRouter from "./src/v2/audits/auditLog.router.js";
import DonorRouter from "./src/v2/donors/donor.router.js";
import PrePoolRouter from "./src/v2/processing/prepool.router.js";
import CollectionRouter from "./src/v2/collection/collection.router.js";
import ReservationRouter from "./src/v2/reservation/reservation.router.js";
import DispensingRouter from "./src/v2/dispensing/dispensing.router.js";
import BeneficiaryRouter from "./src/v2/beneficiaries/beneficiary.router.js";
import NotificationRouter from "./src/v2/notifications/notification.router.js";
import PasteurizationRouter from "./src/v2/processing/pasteurization.router.js";

import { globalErrorHandler } from "./src/middleware/errorHandler.js";

import { CheckExpirationJob } from "./src/shared/service/expiration.service.js";

const port = process.env.PORT || 5000;
const app = express();
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(morganFormat));

Swagger(app, port);

app.use("/api/auth", AuthRouter);
app.use("/api/users", UserRouter);
app.use("/api/pooling", PoolingRouter);
app.use("/api/audit-logs", AuditLogRouter);
app.use("/api/donors", DonorRouter);
app.use("/api/prepool", PrePoolRouter);
app.use("/api/collections", CollectionRouter);
app.use("/api/pasteurization", PasteurizationRouter);
app.use("/api/reservations", ReservationRouter);
app.use("/api/dispensing", DispensingRouter);
app.use("/api/beneficiaries", BeneficiaryRouter);
app.use("/api/notifications", NotificationRouter);

app.use(globalErrorHandler);

CheckExpirationJob();

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
