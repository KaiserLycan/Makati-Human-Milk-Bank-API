import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "./configuration/prisma/schema.prisma",
    datasource: {
        url: env("DATABASE_URL"),
    },
});
