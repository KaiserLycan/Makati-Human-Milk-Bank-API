import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { fileURLToPath } from "url";

const TEMPLATE_DIR = path.resolve(process.cwd(), "library/templates");

export const compileEmailTemplates = (templateBaseName, data) => {
    const htmlPath = path.join(TEMPLATE_DIR, `${templateBaseName}.html.hbs`);
    const textPath = path.join(TEMPLATE_DIR, `${templateBaseName}.txt.hbs`);

    const htmlSource = fs.readFileSync(htmlPath, "utf-8");
    const textSource = fs.readFileSync(textPath, "utf-8");

    const compileHtml = handlebars.compile(htmlSource);
    const compileText = handlebars.compile(textSource);

    return {
        html: compileHtml(data),
        text: compileText(data),
    };
};
