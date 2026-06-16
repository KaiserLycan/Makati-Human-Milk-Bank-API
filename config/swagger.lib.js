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
                    description: "API for managing donors",
                },
                {
                    name: "Beneficiaries",
                    description: "API for managing beneficiaries",
                },
                {
                    name: "Collection",
                    description: "API for managing milk collections",
                },
                {
                    name: "Pre-Pooling",
                    description:
                        "API for managing pre-pooling tasks (raw milk quality testing and incidents)",
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
                    description: "API for managing dispensing",
                },
                {
                    name: "Audit Logs",
                    description: "API for retrieving audit logs",
                },
                {
                    name: "Notifications",
                    description: "API for managing notifications",
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
        apis: ["./routes/*.js"],
    };

    const uiOptions = {
        swaggerOptions: {
            withCredentials: true,
        },
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, uiOptions));
}
