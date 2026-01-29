import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";

let browser = null;

/**
 * Get or create a singleton browser instance
 */
const getBrowser = async () => {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
            ],
        });
    }
    return browser;
};

/**
 * Generate PDF from EJS template
 */
export const generatePDFFromTemplate = async (templateName, data, options = {}) => {
    let context = null;
    try {
        const templatePath = path.join(process.cwd(), "src", "templates", `${templateName}.ejs`);

        // Render HTML from EJS template
        const html = await ejs.renderFile(templatePath, data);

        const browserInstance = await getBrowser();
        context = await browserInstance.createBrowserContext();
        const page = await context.newPage();

        // Set content and wait for it to be loaded
        await page.setContent(html, { waitUntil: "networkidle0" });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: options.format || "A4",
            printBackground: true,
            margin: options.margin || {
                top: "10mm",
                right: "10mm",
                bottom: "10mm",
                left: "10mm",
            },
            ...options,
        });

        return pdfBuffer;
    } catch (error) {
        console.error("Error generating PDF with Puppeteer:", error);
        throw error;
    } finally {
        if (context) {
            await context.close();
        }
    }
};

/**
 * Close browser (use for cleanup during app shutdown)
 */
export const closeBrowser = async () => {
    if (browser) {
        await browser.close();
        browser = null;
    }
};
