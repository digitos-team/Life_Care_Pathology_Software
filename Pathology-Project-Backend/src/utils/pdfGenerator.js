import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.jpeg");

export const generateExpenseReportPDF = (
  doc,
  reportData,
  type,
  year,
  month,
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
      `Type: ${type.toUpperCase()} | Year: ${year}${
        month ? ` | Month: ${month}` : ""
      }`,
      { align: "center" },
    );

  doc.moveDown(1.5);
  doc
    .strokeColor(borderColor)
    .lineWidth(0.5)
    .moveTo(30, doc.y)
    .lineTo(570, doc.y)
    .stroke();
  doc.moveDown(1);

  let grandTotal = 0;

  // 2. Iterate through Time Units (Days or Months)
  reportData.forEach((group) => {
    const timeLabel =
      type === "monthly" ? `Day ${group._id}` : `Month ${group._id}`;

    doc
      .fillColor(accentColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(timeLabel, 35);
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
          doc.text("Amount (INR)", 480, currentY + 6, {
            width: 80,
            align: "right",
          });
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
        doc
          .font("Helvetica-Bold")
          .text(item.amount.toFixed(2), 480, currentY + 6, {
            width: 80,
            align: "right",
          });

        currentY += 22;
        doc
          .strokeColor("#f1f2f6")
          .lineWidth(0.2)
          .moveTo(35, currentY)
          .lineTo(565, currentY)
          .stroke();
      });
    });

    // Subtotal for this period
    doc.moveDown(0.5);
    doc.fillColor(accentColor).font("Helvetica-Bold").fontSize(9);
    doc.text(`Total for ${timeLabel}: INR ${group.totalForPeriod.toFixed(2)}`, {
      align: "right",
      right: 25,
    });
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
  doc.text(`INR ${grandTotal.toFixed(2)}`, 480, finalY + 10, {
    width: 80,
    align: "right",
  });

  // 4. Footer
  doc.moveDown(4);
  doc
    .fillColor("gray")
    .fontSize(8)
    .font("Helvetica-Oblique")
    .text(
      "This is a system-generated expense report and does not require a physical signature.",
      { align: "center", width: 530 },
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
  const patientIdDisplay =
    bill.patientId?.patientId ||
    bill.patientId?._id?.toString().slice(-8).toUpperCase() ||
    "N/A";
  const patientAge = bill.patientId?.age || "N/A";
  const patientGender = bill.patientId?.gender || "N/A";
  const patientPhone = bill.patientId?.phone || "N/A";
  const doctorName = bill.testOrderId?.doctor?.name || "Self";

  doc.text(`Patient Name :  ${patientName}`, patientX, infoTop + 18);
  doc.text(`Patient ID (UHID) :  ${patientIdDisplay}`, patientX, infoTop + 31);
  doc.text(
    `Age & Gender :  ${patientAge} / ${patientGender}`,
    patientX,
    infoTop + 44,
  );
  doc.text(`Mobile Number :  ${patientPhone}`, patientX, infoTop + 57);
  doc.text(`Referred By :  ${doctorName}`, patientX, infoTop + 70);

  // Bill Details section (right aligned)
  doc.fontSize(10).font("Helvetica-Bold").text("BILL DETAILS:", invoiceX);
  doc.font("Helvetica").fontSize(9);
  doc.text(`Bill Number :`, invoiceX, infoTop + 18);
  doc.text(`${bill.billNumber}`, invoiceX + 100, infoTop + 18);
  doc.text(`Bill Date :`, invoiceX, infoTop + 31);
  doc.text(
    `${new Date(bill.createdAt).toLocaleDateString("en-IN")}`,
    invoiceX + 100,
    infoTop + 31,
  );
  doc.text(`Payment Status :`, invoiceX, infoTop + 44);
  doc.text(`${bill.status}`, invoiceX + 100, infoTop + 44);
  doc.text(`Payment Mode :`, invoiceX, infoTop + 57);
  doc.text(
    `${bill.paymentId?.paymentMethod || "CASH"}`,
    invoiceX + 100,
    infoTop + 57,
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
  const totalLabel = bill.status === "PAID" ? "Bill Paid" : "Total Amount Due";
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
  month,
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
    `Report Type: ${type.toUpperCase()} | Year: ${year}${
      month ? ` | Month: ${month}` : ""
    }`,
    { align: "center" },
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
      { width: 90, align: "right" },
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
      { align: "center" },
    );
};

export const generateTestReportPDF = (doc, order, lab) => {
  const primaryBlue = "#1565c0";
  const accentRed = "#d32f2f";
  const darkBlue = "#0d47a1";
  const textDark = "#263238";
  const textGray = "#546e7a";
  const lightGray = "#f8f9fa";
  const borderGray = "#dee2e6";

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const leftMargin = 40;
  const rightMargin = pageWidth - 40;
  const contentWidth = rightMargin - leftMargin;

  /* ================= HEADER ================= */

  doc.rect(0, 0, pageWidth, 6).fill(accentRed);

  doc.image(LOGO_PATH, leftMargin, 12, { width: 45, height: 45 });

  doc
    .fillColor(accentRed)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("Life Care Diagnostic", leftMargin + 60, 14);

  doc
    .fillColor(primaryBlue)
    .fontSize(11)
    .text("Clinical Laboratory", leftMargin + 60, 38);

  doc
    .fontSize(7)
    .fillColor(primaryBlue)
    .text(
      "Fully Automated Computerized Clinical Lab\nHealth Checkup • ECG • Home Visit • Sunday Open",
      rightMargin - 160,
      16,
      { width: 160, align: "right" },
    );

  doc.rect(rightMargin - 160, 46, 160, 16).fill(primaryBlue);
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("LABORATORY REPORT", rightMargin - 160, 50, {
      width: 160,
      align: "center",
    });

  doc
    .strokeColor(borderGray)
    .lineWidth(1)
    .moveTo(leftMargin, 70)
    .lineTo(rightMargin, 70)
    .stroke();

  /* ================= PATIENT INFO ================= */

  let currentY = 78;

  doc
    .fillColor(primaryBlue)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("PATIENT INFORMATION", leftMargin, currentY);

  doc
    .strokeColor(accentRed)
    .lineWidth(2)
    .moveTo(leftMargin, currentY + 12)
    .lineTo(leftMargin + 130, currentY + 12)
    .stroke();

  currentY += 18;

  doc.rect(leftMargin, currentY, contentWidth, 50).fill(lightGray);
  doc.rect(leftMargin, currentY, contentWidth, 50).stroke(borderGray);

  doc.fontSize(8).font("Helvetica-Bold").fillColor(textGray);

  const infoLeftX = leftMargin + 10;
  const infoRightX = pageWidth / 2 + 10;
  let infoY = currentY + 8;

  doc.text("Patient Name:", infoLeftX, infoY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(
      order.patientId?.fullName?.toUpperCase() || "N/A",
      infoLeftX + 90,
      infoY,
    );

  infoY += 12;
  doc
    .font("Helvetica-Bold")
    .fillColor(textGray)
    .text("Age / Gender:", infoLeftX, infoY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(
      `${order.patientId?.age || "N/A"} / ${order.patientId?.gender || "N/A"}`,
      infoLeftX + 90,
      infoY,
    );

  infoY += 12;
  doc
    .font("Helvetica-Bold")
    .fillColor(textGray)
    .text("Patient ID:", infoLeftX, infoY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(order.patientId?.patientId || "N/A", infoLeftX + 90, infoY);

  infoY = currentY + 8;
  doc
    .font("Helvetica-Bold")
    .fillColor(textGray)
    .text("Ref. Doctor:", infoRightX, infoY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(order.doctor?.name || "SELF", infoRightX + 95, infoY);

  infoY += 12;
  doc
    .font("Helvetica-Bold")
    .fillColor(textGray)
    .text("Sample Collected:", infoRightX, infoY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(
      new Date(order.orderDate).toLocaleString("en-IN"),
      infoRightX + 95,
      infoY,
    );

  infoY += 12;
  doc
    .font("Helvetica-Bold")
    .fillColor(textGray)
    .text("Report Date:", infoRightX, infoY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(new Date().toLocaleString("en-IN"), infoRightX + 95, infoY);

  currentY += 62;

  /* ================= TEST RESULTS ================= */

  doc
    .fillColor(primaryBlue)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("TEST RESULTS", leftMargin, currentY);

  doc
    .strokeColor(accentRed)
    .lineWidth(2)
    .moveTo(leftMargin, currentY + 12)
    .lineTo(leftMargin + 90, currentY + 12)
    .stroke();

  currentY += 18;

  // Table Header
  doc.rect(leftMargin, currentY, contentWidth, 16).fill(darkBlue);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(8);

  doc.text("Test Name", leftMargin + 6, currentY + 5, { width: 200 });
  doc.text("Result", leftMargin + 220, currentY + 5);
  doc.text("Unit", leftMargin + 300, currentY + 5);
  doc.text("Reference Range", leftMargin + 370, currentY + 5);

  currentY += 18;

  /* ===== TESTS WITH RESULTS ===== */
  const tests = order.tests.slice(0, 4); // Limit to 4 tests for single page

  let paramY = currentY;

  tests.forEach((test, index) => {
    const rowBg = index % 2 === 0 ? "#fafafa" : "#ffffff";

    // Print TEST NAME first (bold, blue)
    doc
      .fillColor(primaryBlue)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(
        test.testName || test.testId?.testName || "Test",
        leftMargin + 6,
        paramY,
        {
          width: 200,
          lineBreak: false,
        },
      );

    // Move Y down after test name
    paramY += 11;

    // If test has results/parameters, print them
    if (test.results && test.results.length > 0) {
      test.results.forEach((param) => {
        // Parameter name (indented)
        doc
          .fillColor(textGray)
          .font("Helvetica")
          .fontSize(7)
          .text(`  ${param.parameterName || "-"}`, leftMargin + 8, paramY, {
            width: 195,
            lineBreak: false,
          });

        // Result value
        doc
          .fillColor(textDark)
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text(param.value || "-", leftMargin + 220, paramY, {
            lineBreak: false,
          });

        // Unit
        doc
          .fillColor(textGray)
          .fontSize(7)
          .text(param.unit || "-", leftMargin + 300, paramY, {
            lineBreak: false,
          });

        // Reference range
        let refRange = "-";
        if (param.referenceRange) {
          if (
            typeof param.referenceRange === "object" &&
            param.referenceRange !== null
          ) {
            refRange = `${param.referenceRange.min || ""} - ${param.referenceRange.max || ""}`;
          } else {
            refRange = param.referenceRange;
          }
        }
        doc.text(refRange, leftMargin + 370, paramY, {
          width: 125,
          lineBreak: false,
        });

        paramY += 11; // Move down after each parameter
      });
    } else {
      // No results - show "Pending"
      doc
        .fillColor(textGray)
        .fontSize(7)
        .text("Pending", leftMargin + 220, paramY, { lineBreak: false });
      paramY += 11; // Move down after pending message
    }

    paramY += 5; // Extra space after test
  });

  /* ================= FOOTER ================= */

  const footerY = pageHeight - 70;

  doc
    .moveTo(leftMargin, footerY)
    .lineTo(rightMargin, footerY)
    .stroke(borderGray);

  doc
    .fontSize(7)
    .fillColor(textGray)
    .text(
      "This report is electronically generated and does not require a signature.",
      leftMargin,
      footerY + 6,
      { width: contentWidth, align: "center" },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(textDark)
    .text("LAB TECHNICIAN", leftMargin + 40, footerY + 24);

  doc.text("PATHOLOGIST", rightMargin - 120, footerY + 24);
};

export const generateDoctorCommissionReportPDF = (
  doc,
  data,
  doctorName,
  startDate,
  endDate,
) => {
  const accentColor = "#2c3e50";
  const borderColor = "#cccccc";

  // 1. Title
  doc
    .fontSize(18)
    .fillColor(accentColor)
    .text("Doctor Commission Report", { align: "center" });
  doc.moveDown(0.5);

  // 2. Metadata
  doc.fontSize(10).fillColor("black").font("Helvetica-Bold");
  doc.text(`Doctor Name: ${doctorName}`, { align: "center" });

  if (startDate && endDate) {
    doc.text(
      `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      { align: "center" },
    );
  } else {
    doc.text(`Period: All Time`, { align: "center" });
  }

  doc.moveDown();
  doc
    .lineWidth(0.5)
    .strokeColor(borderColor)
    .moveTo(30, doc.y)
    .lineTo(570, doc.y)
    .stroke();
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

  data.forEach((item) => {
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
    doc.text(
      item.patientName ? item.patientName.substring(0, 18) : "N/A",
      colX.patient,
      currentY,
    );
    doc.text(
      item.testOrder ? item.testOrder.substring(0, 25) : "N/A",
      colX.tests,
      currentY,
    );
    doc.text((item.totalBillAmount || 0).toFixed(2), colX.bill, currentY, {
      width: 60,
      align: "right",
    });
    doc.text((item.commissionAmount || 0).toFixed(2), colX.comm, currentY, {
      width: 60,
      align: "right",
    });

    totalCommission += item.commissionAmount || 0;
    currentY += 20;
    doc
      .lineWidth(0.1)
      .strokeColor("#eeeeee")
      .moveTo(30, currentY - 5)
      .lineTo(570, currentY - 5)
      .stroke();
  });

  // 5. Total
  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(12).fillColor(accentColor);
  doc.text(`Total Commission: INR ${totalCommission.toFixed(2)}`, {
    align: "right",
  });

  // 6. Footer section
  doc.fillColor("black").font("Helvetica").fontSize(8);

  // Add page numbers
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 50;
    doc.text(`Page ${i + 1} of ${range.count}`, 30, footerY, {
      align: "center",
    });
    doc.text(`Generated on ${new Date().toLocaleString()}`, 30, footerY + 10, {
      align: "center",
    });
  }
};
