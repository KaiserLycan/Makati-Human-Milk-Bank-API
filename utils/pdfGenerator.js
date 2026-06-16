import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const generatePDF = async (templateName, data) => {
    const templatePath = path.resolve(process.cwd(), `templates/${templateName}.hbs`);
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    const template = handlebars.compile(templateHtml);
    const finalHtml = template(data);

    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Critical for server deployments!
    });
    
    const page = await browser.newPage();

    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures our CSS background colors show up
        margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' }
    });

    await browser.close();
    return pdfBuffer;
};