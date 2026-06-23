import { execSync } from "child_process";

try {
    console.log("Running prisma generate...");
    execSync("npx prisma generate", { stdio: "inherit" });

    console.log("Installing Chrome for Puppeteer...");
    execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
} catch (error) {
    console.error("Error during postinstall:", error.message);
    process.exit(1);
}
