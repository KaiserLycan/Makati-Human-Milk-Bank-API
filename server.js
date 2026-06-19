import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import Swagger from "./configuration/swagger.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { initializeCronJobs } from "./jobs/index.js";
import { subToAuditLogs } from "./services/audit.services.js";
import { logger } from "./library/utils/logger.js";

import UserRouter from "./routers/user.routers.js";
import AuthRouter from "./routers/auth.routers.js";
import AuditLogRouter from "./routers/audit.routers.js";
import DonorRouter from "./routers/donor.routers.js";
import CollectionRouter from "./routers/collection.routers.js";
import PoolingRouter from "./routers/pooling.routers.js";
import PasteurizationRouter from "./routers/pasteurization.routers.js";
import ReservationRouter from "./routers/reservation.routers.js";
import DispensingRouter from "./routers/dispensing.routers.js";
import BeneficiaryRouter from "./routers/beneficiary.routers.js";
import NotificationRouter from "./routers/notification.routers.js";
import ReportsRouter from "./routers/reports.routers.js";
import DashboardRouter from "./routers/dashboard.routers.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(morganFormat, { stream: { write: (message) => logger.info(message.trim()) } }));

const apiRoutes = {
    "/api/auth": AuthRouter,
    "/api/users": UserRouter,
    "/api/donors": DonorRouter,
    "/api/beneficiaries": BeneficiaryRouter,
    "/api/collections": CollectionRouter,
    "/api/pooling": PoolingRouter,
    "/api/pasteurization": PasteurizationRouter,
    "/api/reservations": ReservationRouter,
    "/api/dispensing": DispensingRouter,
    "/api/audit-logs": AuditLogRouter,
    "/api/notifications": NotificationRouter,
    "/api/reports": ReportsRouter,
    "/api/dashboard": DashboardRouter,
};

for (const [path, router] of Object.entries(apiRoutes)) {
    app.use(path, router);
}

Swagger(app, port);

app.use(globalErrorHandler);

const startServer = async () => {
    try {
        await subToAuditLogs();
        initializeCronJobs();
        app.listen(port, () => {
            logger.info(`Server started on http://localhost:${port}`);
        });
    } catch (error) {
        logger.crit("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
