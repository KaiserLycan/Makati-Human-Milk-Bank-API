import { execSync } from "child_process";

if (process.env.NODE_ENV !== "production") {
    try {
        execSync("husky", { stdio: "inherit" });
    } catch (error) {
        console.warn("Husky initialization skipped or failed:", error.message);
    }
} else {
    console.log("Production environment detected. Skipping Husky setup.");
}
