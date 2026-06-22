import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

export default function (app, port) {
    const swaggerOptions = {
        swaggerDefinition: {
            openapi: "3.0.0",
            info: {
                title: "Makati Human Milk Bank API",
                version: "1.0.0",
                description: "Backend API Services",
            },
            tags: [
                {
                    name: "Authentication",
                    description: "API for user authentication",
                },
                {
                    name: "User Management",
                    description: "API for managing user accounts",
                },
                {
                    name: "Donors",
                    description: "API for managing 03 donors",
                },
                {
                    name: "Beneficiaries",
                    description: "API for managing 04 beneficiaries",
                },
                {
                    name: "Collection",
                    description: "API for managing milk collections",
                },
                {
                    name: "Pooling",
                    description: "API for pooling of raw milk",
                },
                {
                    name: "Pasteurization",
                    description: "API for managing pasteurization batches and MBT testing",
                },
                {
                    name: "Reservation",
                    description: "API for managing reservations",
                },
                {
                    name: "Dispensing",
                    description: "API for managing 07 dispensing",
                },
                {
                    name: "Audit Logs",
                    description: "API for retrieving audit logs",
                },
                {
                    name: "Notifications",
                    description: "API for managing 11 notifications",
                },
                {
                    name: "Reports",
                    description: "API for generating reports",
                },
            ],
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: "access_token",
                        description:
                            "Paste your raw JWT token string here. Swagger will send it as a cookie.",
                    },
                },
            },
            servers: [
                {
                    url: `http://localhost:${port}`,
                },
                {
                    url: `https://makati-human-milk-bank-api.onrender.com`,
                },
            ],
        },
        apis: [
            "./routers/audit.routers.js",
            "./routers/auth.routers.js",
            "./routers/beneficiary.routers.js",
            "./routers/collection.routers.js",
            "./routers/dashboard.routers.js",
            "./routers/dispensing.routers.js",
            "./routers/donor.routers.js",
            "./routers/notification.routers.js",
            "./routers/pasteurization.routers.js",
            "./routers/pooling.routers.js",
            "./routers/reports.routers.js",
            "./routers/reservation.routers.js",
            "./routers/user.routers.js",
        ],
    };

    const uiOptions = {
        swaggerOptions: {
            withCredentials: true,
        },
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);

    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerDocs);
    });

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, uiOptions));
}
