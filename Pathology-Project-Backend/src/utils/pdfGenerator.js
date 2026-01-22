import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.jpeg');

export const generateExpenseReportPDF = (
  doc,
  reportData,
  type,
  year,
  month
) => {
  const accentColor = "#2c3e50";
  const borderColor = "#eeeeee";
  const headerColor = "#f8f9fa";

  // 1. Header Section
  doc
    .fillColor(accentColor)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("EXPENSE REPORT", { align: "center" });

  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#7f8c8d")
    .text(
      `Type: ${type.toUpperCase()} | Year: ${year}${month ? ` | Month: ${month}` : ""
      }`,
      { align: "center" }
    );

  doc.moveDown(1.5);
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown(1);

  let grandTotal = 0;

  // 2. Iterate through Time Units (Days or Months)
  reportData.forEach((group) => {
    const timeLabel = type === "monthly" ? `Day ${group._id}` : `Month ${group._id}`;

    doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(timeLabel, 35);
    doc.moveDown(0.5);

    // Table Header for this group
    const tableTop = doc.y;
    doc.rect(35, tableTop, 530, 20).fill(headerColor).stroke(borderColor);
    doc.fillColor(accentColor).font("Helvetica-Bold").fontSize(9);

    doc.text("Title / Particulars", 40, tableTop + 6);
    doc.text("Category", 230, tableTop + 6);
    doc.text("Dr / Supplier", 350, tableTop + 6);
    doc.text("Amount (INR)", 480, tableTop + 6, { width: 80, align: "right" });

    let currentY = tableTop + 20;

    // Iterate through Categories in this group
    group.categories.forEach((cat) => {
      // Iterate through individual items
      cat.items.forEach((item) => {
        // Page break check
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
          // Redraw header if page breaks inside a group
          doc.rect(35, currentY, 530, 20).fill(headerColor).stroke(borderColor);
          doc.fillColor(accentColor).font("Helvetica-Bold").fontSize(9);
          doc.text("Title / Particulars", 40, currentY + 6);
          doc.text("Category", 230, currentY + 6);
          doc.text("Dr / Supplier", 350, currentY + 6);
          doc.text("Amount (INR)", 480, currentY + 6, { width: 80, align: "right" });
          currentY += 20;
        }

        doc.fillColor("#2d3436").font("Helvetica").fontSize(8);

        // Particulars
        doc.text(item.title, 40, currentY + 6, { width: 180 });

        // Category
        doc.text(cat.category.replace("_", " "), 230, currentY + 6);

        // Dr / Supplier
        const ref = item.doctorName || item.supplier || "N/A";
        doc.text(ref, 350, currentY + 6, { width: 120 });

        // Amount
        doc.font("Helvetica-Bold").text(item.amount.toFixed(2), 480, currentY + 6, { width: 80, align: "right" });

        currentY += 22;
        doc.strokeColor("#f1f2f6").lineWidth(0.2).moveTo(35, currentY).lineTo(565, currentY).stroke();
      });
    });

    // Subtotal for this period
    doc.moveDown(0.5);
    doc.fillColor(accentColor).font("Helvetica-Bold").fontSize(9);
    doc.text(`Total for ${timeLabel}: INR ${group.totalForPeriod.toFixed(2)}`, { align: "right", right: 25 });
    doc.moveDown(1.5);

    grandTotal += group.totalForPeriod;
    currentY = doc.y;
  });

  // 3. Grand Total at the end
  doc.moveDown(2);
  const finalY = doc.y;
  doc.rect(350, finalY, 215, 30).fill(accentColor).stroke();
  doc.fillColor("white").fontSize(12).font("Helvetica-Bold");
  doc.text("GRAND TOTAL", 360, finalY + 10);
  doc.text(`INR ${grandTotal.toFixed(2)}`, 480, finalY + 10, { width: 80, align: "right" });

  // 4. Footer
  doc.moveDown(4);
  doc.fillColor("gray").fontSize(8).font("Helvetica-Oblique").text(
    "This is a system-generated expense report and does not require a physical signature.",
    { align: "center", width: 530 }
  );
};

export const generateBillPDF = (doc, bill, lab) => {
  // Medical-style layout (Minimal colors: black/gray with dark accent)
  const accentColor = "#2c3e50"; // Dark blue/gray accent
  const borderColor = "#cccccc";
  const lightGray = "#f2f2f2";

  // 1. Header: Lab Name (bold, large)
  doc
    .fillColor(accentColor)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(lab.labName.toUpperCase(), { align: "left" });

  doc.fontSize(10).font("Helvetica").fillColor("black");
  doc.text(lab.address || "");
  doc.text(`Phone: ${lab.contact || ""} | Email: ${lab.email || ""}`);
  doc.text(`GSTIN: ${lab.gstNumber || ""}`);

  doc.moveDown();

  // 2. Title: BILL / TAX INVOICE (Centered)
  doc.fontSize(16).font("Helvetica-Bold").text("BILL", { align: "center" });
  doc.moveDown(0.2);
  doc.lineWidth(0.5).moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown();

  // 3. Info Sections: Patient info on left, Invoice Details on right
  const patientX = 35;
  const invoiceX = 350;
  const infoTop = doc.y;

  // Patient Information section
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("PATIENT INFORMATION:", patientX);
  doc.font("Helvetica").fontSize(9);

  // Safety checks for patient data
  const patientName = bill.patientId?.fullName || "N/A";
  const patientIdDisplay = bill.patientId?.patientId || bill.patientId?._id?.toString().slice(-8).toUpperCase() || "N/A";
  const patientAge = bill.patientId?.age || "N/A";
  const patientGender = bill.patientId?.gender || "N/A";
  const patientPhone = bill.patientId?.phone || "N/A";
  const doctorName = bill.testOrderId?.doctor?.name || "Self";

  doc.text(
    `Patient Name :  ${patientName}`,
    patientX,
    infoTop + 18
  );
  doc.text(
    `Patient ID (UHID) :  ${patientIdDisplay}`,
    patientX,
    infoTop + 31
  );
  doc.text(
    `Age & Gender :  ${patientAge} / ${patientGender}`,
    patientX,
    infoTop + 44
  );
  doc.text(
    `Mobile Number :  ${patientPhone}`,
    patientX,
    infoTop + 57
  );
  doc.text(
    `Referred By :  ${doctorName}`,
    patientX,
    infoTop + 70
  );

  // Bill Details section (right aligned)
  doc.fontSize(10).font("Helvetica-Bold").text("BILL DETAILS:", invoiceX);
  doc.font("Helvetica").fontSize(9);
  doc.text(`Bill Number :`, invoiceX, infoTop + 18);
  doc.text(`${bill.billNumber}`, invoiceX + 100, infoTop + 18);
  doc.text(`Bill Date :`, invoiceX, infoTop + 31);
  doc.text(
    `${new Date(bill.createdAt).toLocaleDateString("en-IN")}`,
    invoiceX + 100,
    infoTop + 31
  );
  doc.text(`Payment Status :`, invoiceX, infoTop + 44);
  doc.text(`${bill.status}`, invoiceX + 100, infoTop + 44);
  doc.text(`Payment Mode :`, invoiceX, infoTop + 57);
  doc.text(
    `${bill.paymentId?.paymentMethod || "CASH"}`,
    invoiceX + 100,
    infoTop + 57
  );

  doc.moveDown(8);

  // 4. Test Details Table: Columns: Description | Quantity | Unit Price | Amount
  const tableTop = doc.y;
  doc.rect(30, tableTop, 540, 20).fill(lightGray).stroke(borderColor);
  doc.fillColor("black").font("Helvetica-Bold").fontSize(10);
  doc.text("Description", 35, tableTop + 5);
  doc.text("Quantity", 280, tableTop + 5, { width: 50, align: "center" });
  doc.text("Unit Price (INR)", 380, tableTop + 5, {
    width: 80,
    align: "right",
  });
  doc.text("Amount (INR)", 480, tableTop + 5, { width: 80, align: "right" });

  let currentY = tableTop + 20;
  doc.font("Helvetica").fontSize(9);

  bill.items.forEach((item) => {
    doc.text(item.name, 40, currentY + 7, { width: 230 });
    doc.text("1", 280, currentY + 7, { width: 50, align: "center" });
    doc.text(`${item.price.toFixed(2)}`, 380, currentY + 7, {
      width: 80,
      align: "right",
    });
    doc.text(`${item.price.toFixed(2)}`, 480, currentY + 7, {
      width: 80,
      align: "right",
    });

    currentY += 25;
    doc
      .lineWidth(0.2)
      .moveTo(30, currentY)
      .lineTo(570, currentY)
      .stroke("#eeeeee");
  });

  // Stroke outer table box
  doc
    .lineWidth(0.5)
    .strokeColor(borderColor)
    .rect(30, tableTop, 540, currentY - tableTop)
    .stroke();

  // 5. Amount Summary box (right aligned)
  const totalAmount = bill.totalAmount;

  currentY += 15;
  const summaryX = 350;

  doc
    .rect(summaryX, currentY - 2, 220, 25)
    .fill(accentColor)
    .stroke();
  doc.fillColor("white").font("Helvetica-Bold").fontSize(11);
  const totalLabel = bill.status === 'PAID' ? "Bill Paid" : "Total Amount Due";
  doc.text(totalLabel, summaryX + 10, currentY + 6, {
    width: 120,
    align: "left",
  });
  doc.text(`INR ${totalAmount.toFixed(2)}`, 480, currentY + 6, {
    width: 80,
    align: "right",
  });

  // 6. Footer section
  doc.fillColor("black").font("Helvetica").fontSize(8);
  const footerY = doc.page.height - 100;

  // Signature placeholder
  doc.text("__________________________", 400, footerY - 20);
  doc.text("Authorized Signatory / Stamp", 400, footerY - 5);

  doc.text("• This is a computer-generated invoice.", 35, footerY - 10);
  doc.text("• Reports are valid for 1 year from test date.", 35, footerY);

  doc.moveDown(3);
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Thank you for your business!", { align: "center", width: 540 });
};

export const generateBillingReportPDF = (
  doc,
  reportData,
  type,
  year,
  month
) => {
  const accentColor = "#2c3e50";
  const borderColor = "#eeeeee";

  // 1. Report Title
  doc
    .fillColor(accentColor)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("BILLING SUMMARY REPORT", { align: "center" });

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").fillColor("gray");
  doc.text(
    `Report Type: ${type.toUpperCase()} | Year: ${year}${month ? ` | Month: ${month}` : ""
    }`,
    { align: "center" }
  );

  doc.moveDown(1);
  doc
    .lineWidth(0.5)
    .strokeColor(borderColor)
    .moveTo(30, doc.y)
    .lineTo(570, doc.y)
    .stroke();
  doc.moveDown(1);

  let grandTotal = 0;
  let grandPaid = 0;
  let grandPending = 0;

  // 2. Report Content (Period-wise)
  reportData.forEach((group) => {
    const startY = doc.y;

    // Left Zone: Period and Count
    doc
      .fillColor(accentColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`PERIOD: ${group._id}`, 40, startY);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("black")
      .text(`Bill Count: ${group.billCount}`, 40, startY + 15);

    // Right Zone: Financial Totals
    const rightAlignX = 350;
    const valueColumnX = 480;

    doc.text("Total Amount :", rightAlignX, startY, {
      width: 120,
      align: "right",
    });
    doc.text(`INR ${group.totalAmount.toFixed(2)}`, valueColumnX, startY, {
      width: 90,
      align: "right",
    });

    doc.fillColor("green").text("Paid Amount :", rightAlignX, startY + 12, {
      width: 120,
      align: "right",
    });
    doc.text(`INR ${group.paidAmount.toFixed(2)}`, valueColumnX, startY + 12, {
      width: 90,
      align: "right",
    });

    doc.fillColor("red").text("Pending Amount :", rightAlignX, startY + 24, {
      width: 120,
      align: "right",
    });
    doc.text(
      `INR ${group.pendingAmount.toFixed(2)}`,
      valueColumnX,
      startY + 24,
      { width: 90, align: "right" }
    );

    grandTotal += group.totalAmount;
    grandPaid += group.paidAmount;
    grandPending += group.pendingAmount;

    doc.moveDown(2);
    doc
      .lineWidth(0.2)
      .strokeColor(borderColor)
      .moveTo(40, doc.y)
      .lineTo(570, doc.y)
      .stroke();
    doc.moveDown(1);
  });

  // 3. Grand Totals (Right Aligned Bottom)
  doc.moveDown(2);
  const finalSummaryX = 350;
  const finalValueX = 480;

  doc
    .fillColor(accentColor)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("GRAND TOTALS", finalSummaryX + 20, doc.y);
  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica-Bold").fillColor("black");
  doc.text("Total Revenue :", finalSummaryX, doc.y, {
    width: 120,
    align: "right",
  });
  doc.text(`INR ${grandTotal.toFixed(2)}`, finalValueX, doc.y - 12, {
    width: 90,
    align: "right",
  });
  doc.moveDown(0.2);

  doc
    .fillColor("green")
    .text("Total Paid :", finalSummaryX, doc.y, { width: 120, align: "right" });
  doc.text(`INR ${grandPaid.toFixed(2)}`, finalValueX, doc.y - 12, {
    width: 90,
    align: "right",
  });
  doc.moveDown(0.2);

  doc.fillColor("red").text("Total Pending :", finalSummaryX, doc.y, {
    width: 120,
    align: "right",
  });
  doc.text(`INR ${grandPending.toFixed(2)}`, finalValueX, doc.y - 12, {
    width: 90,
    align: "right",
  });

  doc.moveDown(4);
  doc
    .fillColor("gray")
    .fontSize(8)
    .font("Helvetica")
    .text(
      "This is an automated financial summary report generated by the pathology lab system.",
      { align: "center" }
    );
};

export const generateTestReportPDF = (doc, order, lab) => {
  // Colors matching Life Care format
  const blueColor = "#1e3a8a";
  const redColor = "#dc2626";
  const blackColor = "#000000";
  const grayColor = "#666666";

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const leftMargin = 40;
  const rightMargin = pageWidth - 40;
  const contentWidth = rightMargin - leftMargin;

  // Helper: page break handler
  const ensureSpace = (y, space = 30) => {
    if (y + space > pageHeight - 120) {
      doc.addPage();
      return 100;
    }
    return y;
  };

  /* ================== HEADER SECTION ================== */

  // Add logo image
  try {
    doc.image(LOGO_PATH, leftMargin, 20, { width: 50, height: 50 });
  } catch (e) {
    console.log('Logo not found, continuing without image');
  }

  // Left side - Logo text next to image
  doc
    .fillColor(redColor)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("Life Care", leftMargin + 55, 25);

  doc
    .fillColor(redColor)
    .font("Helvetica")
    .fontSize(8)
    .text("®", leftMargin + 140, 23);

  doc
    .fillColor(blueColor)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Diagnostic", leftMargin + 55, 48);

  // Right side - Clinical Laboratory info
  doc
    .fillColor(blueColor)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Clinical Laboratory", rightMargin - 200, 25, { width: 200, align: "right" });

  doc
    .fillColor(blueColor)
    .font("Helvetica")
    .fontSize(8);

  const bulletPoints = [
    "• Fully Automated Computerised Clinical Lab",
    "• Health Check up for company • ECG",
    "• Home Visit • Sunday Open"
  ];

  let bulletY = 45;
  bulletPoints.forEach(point => {
    doc.text(point, rightMargin - 200, bulletY, { width: 200, align: "right" });
    bulletY += 10;
  });

  // Separator line
  doc
    .strokeColor(blueColor)
    .lineWidth(1)
    .moveTo(leftMargin, 85)
    .lineTo(rightMargin - 20, 85)
    .stroke();

  /* ================== PATIENT INFO SECTION ================== */

  let currentY = 95;

  // Patient info background
  doc.rect(leftMargin, currentY, contentWidth - 20, 60).fill("#f8fafc");

  // Left column - Patient details
  const labelWidth = 80;
  const valueX = leftMargin + labelWidth + 5;

  doc.fillColor(blueColor).font("Helvetica-Bold").fontSize(9);
  doc.text("Reg No:", leftMargin + 5, currentY + 5);
  doc.fillColor(blackColor).font("Helvetica").text(order._id?.toString().slice(-6).toUpperCase() || "000000", valueX, currentY + 5);

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Patient Name:", leftMargin + 5, currentY + 17);
  doc.fillColor(blackColor).font("Helvetica").text(order.patientId?.fullName?.toUpperCase() || "N/A", valueX, currentY + 17);

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Age/Gender:", leftMargin + 5, currentY + 29);
  doc.fillColor(blackColor).font("Helvetica").text(`${order.patientId?.age || "N/A"} Years/${order.patientId?.gender || "N/A"}`, valueX, currentY + 29);

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Lab Care:", leftMargin + 5, currentY + 41);
  doc.fillColor(blackColor).font("Helvetica").text(lab?.labName || "Life Care Diagnostic", valueX, currentY + 41);

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Ref by:", leftMargin + 5, currentY + 53);
  doc.fillColor(blackColor).font("Helvetica").text(order.doctor?.name || "SELF", valueX, currentY + 53);

  // Right column - Dates
  const rightColX = pageWidth / 2 + 20;
  const rightValueX = rightColX + 120;

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Bill Date & Time:", rightColX, currentY + 5);
  doc.fillColor(blackColor).font("Helvetica").text(
    new Date(order.orderDate).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
    rightValueX, currentY + 5
  );

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Collection Date & Time:", rightColX, currentY + 17);
  doc.fillColor(blackColor).font("Helvetica").text(
    new Date(order.orderDate).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
    rightValueX, currentY + 17
  );

  doc.fillColor(blueColor).font("Helvetica-Bold");
  doc.text("Authenticate Date & Time:", rightColX, currentY + 29);
  doc.fillColor(blackColor).font("Helvetica").text(
    new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
    rightValueX, currentY + 29
  );

  currentY += 70;

  /* ================== TEST RESULTS SECTION ================== */

  // Group tests by category
  const categories = [...new Set(order.tests.map(t => t.testId?.category || "TEST REPORT"))];

  categories.forEach(category => {
    currentY = ensureSpace(currentY, 50);

    // Category header
    doc
      .fillColor(blueColor)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(category.toUpperCase(), leftMargin, currentY, {
        width: contentWidth - 20,
        align: "center",
        underline: true
      });

    currentY += 20;

    // Table header
    doc.rect(leftMargin, currentY, contentWidth - 20, 18).fill("#e0e7ff");

    doc.fillColor(blueColor).font("Helvetica-Bold").fontSize(9);
    doc.text("TEST", leftMargin + 5, currentY + 5);
    doc.text("RESULT", leftMargin + 180, currentY + 5);
    doc.text("UNIT", leftMargin + 280, currentY + 5);
    doc.text("BIOLOGICAL REFER RANGE", leftMargin + 350, currentY + 5);

    currentY += 22;

    // Filter tests for this category
    const categoryTests = order.tests.filter(t => (t.testId?.category || "TEST REPORT") === category);

    categoryTests.forEach(test => {
      currentY = ensureSpace(currentY, 20);

      // Test name as sub-header
      doc
        .fillColor(blueColor)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(test.testName?.toUpperCase() || "TEST", leftMargin + 5, currentY);

      currentY += 14;

      // Test parameters/results
      if (test.results && test.results.length > 0) {
        test.results.forEach(param => {
          currentY = ensureSpace(currentY, 14);

          doc.fillColor(blueColor).font("Helvetica").fontSize(8);
          doc.text(param.parameterName || "-", leftMargin + 10, currentY);

          doc.fillColor(blackColor).font("Helvetica-Bold");
          doc.text(param.value || "-", leftMargin + 180, currentY);

          doc.fillColor(grayColor).font("Helvetica");
          doc.text(param.unit || "-", leftMargin + 280, currentY);

          // Reference range
          let refRange = "-";
          if (param.referenceRange) {
            if (typeof param.referenceRange === "object" && param.referenceRange !== null) {
              refRange = `${param.referenceRange.min || ""} - ${param.referenceRange.max || ""}`;
            } else {
              refRange = param.referenceRange;
            }
          }
          doc.text(refRange, leftMargin + 350, currentY);

          currentY += 12;
        });
      }

      currentY += 5;
    });

    currentY += 10;
  });

  /* ================== FOOTER SECTION (ALL PAGES) ================== */

  const pageRange = doc.bufferedPageRange();

  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);

    const footerY = pageHeight - 100;

    // Separator line
    doc
      .strokeColor(blueColor)
      .lineWidth(0.5)
      .moveTo(leftMargin, footerY)
      .lineTo(rightMargin - 20, footerY)
      .stroke();

    // Left signature - Lab Technician
    doc
      .fillColor(blackColor)
      .font("Helvetica")
      .fontSize(8)
      .text("_____________________", leftMargin, footerY + 5);
    doc.font("Helvetica-Bold").text("Lab Technician", leftMargin, footerY + 18);

    // Right signature - Pathologist
    doc
      .font("Helvetica")
      .text("_____________________", rightMargin - 150, footerY + 5);
    doc.font("Helvetica-Bold").text("Pathologist", rightMargin - 150, footerY + 18);
    doc.font("Helvetica").fontSize(7).text("M.D. (Pathology)", rightMargin - 150, footerY + 28);

    // Bottom address bar
    const addressY = pageHeight - 55;
    doc.rect(leftMargin - 10, addressY, contentWidth, 20).fill(blueColor);

    doc
      .fillColor("white")
      .font("Helvetica")
      .fontSize(7)
      .text(
        `Add: ${lab?.address || "Life Care Diagnostic Laboratory"} | Ph: ${lab?.contact || "N/A"} | Email: ${lab?.email || "N/A"}`,
        leftMargin, addressY + 6,
        { width: contentWidth - 20, align: "center" }
      );

    // Disclaimer
    doc
      .fillColor(grayColor)
      .font("Helvetica-Oblique")
      .fontSize(6)
      .text(
        "These are only Laboratory & Technical Test Results. These are not Medical Diagnostic Results for case pattern diagnosis, confirm diagnosis & clinical finding.",
        leftMargin, pageHeight - 30,
        { width: contentWidth - 20, align: "center" }
      );
  }
};

export const generateDoctorCommissionReportPDF = (doc, data, doctorName, startDate, endDate) => {
  const accentColor = "#2c3e50";
  const borderColor = "#cccccc";

  // 1. Title
  doc.fontSize(18).fillColor(accentColor).text("Doctor Commission Report", { align: "center" });
  doc.moveDown(0.5);

  // 2. Metadata
  doc.fontSize(10).fillColor("black").font("Helvetica-Bold");
  doc.text(`Doctor Name: ${doctorName}`, { align: "center" });

  if (startDate && endDate) {
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: "center" });
  } else {
    doc.text(`Period: All Time`, { align: "center" });
  }

  doc.moveDown();
  doc.lineWidth(0.5).strokeColor(borderColor).moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown();

  // 3. Table Header
  const tableTop = doc.y;
  const colX = { date: 30, patient: 110, tests: 230, bill: 400, comm: 490 };

  doc.font("Helvetica-Bold").fontSize(9).fillColor("black");
  doc.text("Date", colX.date, tableTop);
  doc.text("Patient Name", colX.patient, tableTop);
  doc.text("Tests", colX.tests, tableTop);
  doc.text("Bill Amt", colX.bill, tableTop, { width: 60, align: "right" });
  doc.text("Comm Amt", colX.comm, tableTop, { width: 60, align: "right" });

  doc.moveDown(0.5);
  doc.lineWidth(0.5).moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown(0.5);

  let currentY = doc.y;
  let totalCommission = 0;

  // 4. Data Rows
  doc.font("Helvetica").fontSize(9);

  data.forEach(item => {
    // Check page break
    if (currentY > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
      // Re-draw header
      doc.font("Helvetica-Bold").fontSize(9).fillColor("black");
      doc.text("Date", colX.date, currentY);
      doc.text("Patient Name", colX.patient, currentY);
      doc.text("Tests", colX.tests, currentY);
      doc.text("Bill Amt", colX.bill, currentY, { width: 60, align: "right" });
      doc.text("Comm Amt", colX.comm, currentY, { width: 60, align: "right" });
      currentY += 20;
    }

    doc.text(new Date(item.date).toLocaleDateString(), colX.date, currentY);
    doc.text(item.patientName ? item.patientName.substring(0, 18) : "N/A", colX.patient, currentY);
    doc.text(item.testOrder ? item.testOrder.substring(0, 25) : "N/A", colX.tests, currentY);
    doc.text((item.totalBillAmount || 0).toFixed(2), colX.bill, currentY, { width: 60, align: "right" });
    doc.text((item.commissionAmount || 0).toFixed(2), colX.comm, currentY, { width: 60, align: "right" });

    totalCommission += (item.commissionAmount || 0);
    currentY += 20;
    doc.lineWidth(0.1).strokeColor("#eeeeee").moveTo(30, currentY - 5).lineTo(570, currentY - 5).stroke();
  });

  // 5. Total
  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(12).fillColor(accentColor);
  doc.text(`Total Commission: INR ${totalCommission.toFixed(2)}`, { align: "right" });

  // 6. Footer section
  doc.fillColor("black").font("Helvetica").fontSize(8);

  // Add page numbers
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 50;
    doc.text(`Page ${i + 1} of ${range.count}`, 30, footerY, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleString()}`, 30, footerY + 10, { align: "center" });
  }
};
