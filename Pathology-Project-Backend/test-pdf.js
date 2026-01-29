import { generatePDFFromTemplate, closeBrowser } from "./src/utils/puppeteerGenerator.js";
import fs from "fs";
import path from "path";

const dummyOrder = {
    patientId: {
        fullName: "John Doe",
        age: "45",
        gender: "Male",
        phone: "9876543210",
        patientId: "UHID12345"
    },
    orderDate: new Date(),
    doctor: { name: "Dr. Smith" },
    tests: [
        {
            testName: "Complete Blood Count",
            results: [
                { parameterName: "Haemoglobin", value: "14.5", unit: "g/dL", referenceRange: { min: 13, max: 17 } },
                { parameterName: "WBC Count", value: "7500", unit: "/cumm", referenceRange: { min: 4000, max: 11000 } }
            ]
        }
    ]
};

const dummyLab = {
    name: "Life Care Diagnostic",
    address: "Ganga Bhavan Bldg, Mohopada"
};

async function test() {
    console.log("Starting PDF generation test...");
    try {
        const pdfBuffer = await generatePDFFromTemplate("report", {
            order: dummyOrder,
            lab: dummyLab,
            logo: null // For test, skip logo or use a placeholder
        });

        const outputPath = path.join(process.cwd(), "test-report.pdf");
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log("PDF generated successfully at:", outputPath);
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await closeBrowser();
    }
}

test();
