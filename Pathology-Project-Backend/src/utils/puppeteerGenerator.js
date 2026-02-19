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

        // Prepare PDF options
        const pdfOptions = {
            format: options.format || "A4",
            printBackground: true,
        };

        // If headerTemplate and footerTemplate are provided, use displayHeaderFooter
        if (options.headerTemplate || options.footerTemplate) {
            pdfOptions.displayHeaderFooter = true;
            pdfOptions.headerTemplate = options.headerTemplate || '<div></div>';
            pdfOptions.footerTemplate = options.footerTemplate || '<div></div>';

            // Set margins when using displayHeaderFooter
            pdfOptions.margin = {
                top: options.marginTop || "110px",
                right: "10mm",
                bottom: options.marginBottom || "180px",
                left: "10mm",
            };
        } else {
            // Default margins when not using displayHeaderFooter
            pdfOptions.margin = options.margin || {
                top: "10mm",
                right: "10mm",
                bottom: "10mm",
                left: "10mm",
            };
        }

        // Generate PDF
        const pdfBuffer = await page.pdf(pdfOptions);

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
