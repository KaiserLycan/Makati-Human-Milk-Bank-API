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
