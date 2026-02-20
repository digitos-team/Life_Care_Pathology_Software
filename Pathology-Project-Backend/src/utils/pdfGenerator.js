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
      `Type: ${type.toUpperCase()} | Year: ${year}${month ? ` | Month: ${month}` : ""
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
  const primaryBlue = "#1565c0";

  // 1. Header: Life Care Branding
  // Logo
  try {
    doc.image(LOGO_PATH, 30, 20, { width: 55, height: 55, fit: [55, 55] });
  } catch (err) {
    // console.error("Logo not found", err);
  }

  // Dashboard-style Text (Life Care)
  doc
    .fillColor("#1a1a1a") // Dark text
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("Life Care", 95, 28);

  // Subtitle (PATHOLOGY LAB)
  doc
    .fillColor("#4f46e5") // Indigo accent
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("PATHOLOGY LAB", 95, 56, {
      characterSpacing: 3, // Wide tracking
    });

  // Lab Details
  const detailsY = 85;
  doc.fontSize(9).font("Helvetica").fillColor("black");
  doc.text(lab.address || "", 30, detailsY);
  doc.text(`Phone: ${lab.contact || ""} | Email: ${lab.email || ""}`, 30, detailsY + 12);
  doc.text(`GSTIN: ${lab.gstNumber || ""}`, 30, detailsY + 24);
  doc.y = detailsY + 36; // Ensure cursor is updated for next section

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

  let tableY = tableTop + 20;
  doc.font("Helvetica").fontSize(9);

  bill.items.forEach((item) => {
    doc.text(item.name, 40, tableY + 7, { width: 230 });
    doc.text("1", 280, tableY + 7, { width: 50, align: "center" });
    doc.text(`${item.price.toFixed(2)}`, 380, tableY + 7, {
      width: 80,
      align: "right",
    });
    doc.text(`${item.price.toFixed(2)}`, 480, tableY + 7, {
      width: 80,
      align: "right",
    });

    tableY += 25;
    doc
      .lineWidth(0.2)
      .moveTo(30, tableY)
      .lineTo(570, tableY)
      .stroke("#eeeeee");
  });

  // Stroke outer table box
  doc
    .lineWidth(0.5)
    .strokeColor(borderColor)
    .rect(30, tableTop, 540, tableY - tableTop)
    .stroke();

  // 5. Amount Summary box (right aligned)
  const netAmount = bill.totalAmount;
  const discountAmount = bill.discountAmount || 0;
  const grossAmount = netAmount + discountAmount;

  tableY += 15;
  const summaryX = 350;

  // Subtotal (Gross)
  doc.fillColor("black").font("Helvetica").fontSize(9);
  doc.text("Subtotal (Gross) :", summaryX + 10, tableY);
  doc.text(`INR ${grossAmount.toFixed(2)}`, 480, tableY, { width: 80, align: "right" });
  tableY += 15;

  // Discount
  if (discountAmount > 0) {
    doc.fillColor("#e67e22").font("Helvetica-Bold");
    doc.text("Discount :", summaryX + 10, tableY);
    doc.text(`- INR ${discountAmount.toFixed(2)}`, 480, tableY, { width: 80, align: "right" });
    tableY += 15;
  }

  // Final Total
  doc
    .rect(summaryX, tableY - 4, 220, 22)
    .fill(accentColor)
    .stroke();
  doc.fillColor("white").font("Helvetica-Bold").fontSize(11);
  const totalLabel = bill.status === "PAID" ? "Amount Paid" : "Net Amount Due";
  doc.text(totalLabel, summaryX + 10, tableY + 6, {
    width: 120,
    align: "left",
  });
  doc.text(`INR ${netAmount.toFixed(2)}`, 480, tableY + 6, {
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
    `Report Type: ${type.toUpperCase()} | Year: ${year}${month ? ` | Month: ${month}` : ""
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

    doc.text("Gross Revenue :", rightAlignX, startY, {
      width: 120,
      align: "right",
    });
    doc.text(`INR ${group.totalAmount.toFixed(2)}`, valueColumnX, startY, {
      width: 90,
      align: "right",
    });

    const groupDiscount = group.totalDiscount || 0;
    doc.fillColor("#e67e22").text("Total Discount :", rightAlignX, startY + 12, {
      width: 120,
      align: "right",
    });
    doc.text(`INR ${groupDiscount.toFixed(2)}`, valueColumnX, startY + 12, {
      width: 90,
      align: "right",
    });

    doc.fillColor("green").text("Paid Amount :", rightAlignX, startY + 24, {
      width: 120,
      align: "right",
    });
    doc.text(`INR ${group.paidAmount.toFixed(2)}`, valueColumnX, startY + 24, {
      width: 90,
      align: "right",
    });

    doc.fillColor("red").text("Pending Amount :", rightAlignX, startY + 36, {
      width: 120,
      align: "right",
    });
    doc.text(
      `INR ${group.pendingAmount.toFixed(2)}`,
      valueColumnX,
      startY + 36,
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
  doc.text("Gross Revenue :", finalSummaryX, doc.y, {
    width: 120,
    align: "right",
  });
  doc.text(`INR ${grandTotal.toFixed(2)}`, finalValueX, doc.y - 12, {
    width: 90,
    align: "right",
  });
  doc.moveDown(0.2);

  const totalGrandDiscount = reportData.reduce((acc, g) => acc + (g.totalDiscount || 0), 0);
  doc.fillColor("#e67e22").text("Total Discount :", finalSummaryX, doc.y, {
    width: 120,
    align: "right",
  });
  doc.text(`INR ${totalGrandDiscount.toFixed(2)}`, finalValueX, doc.y - 12, {
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

// export const generateTestReportPDF = (doc, order, lab) => {
//   const primaryBlue = "#1565c0";
//   const accentRed = "#d32f2f";
//   const darkBlue = "#0d47a1";
//   const textDark = "#263238";
//   const textGray = "#546e7a";
//   const lightGray = "#f8f9fa";
//   const borderGray = "#dee2e6";

//   const pageWidth = doc.page.width;
//   const pageHeight = doc.page.height;
//   const leftMargin = 40;
//   const rightMargin = pageWidth - 40;
//   const contentWidth = rightMargin - leftMargin;
//   const footerHeight = 110;
//   const maxContentY = pageHeight - footerHeight;

//   let currentY = 0;
//   let currentPage = 1;

//   // Function to add header
//   const addHeader = () => {
//     // Top red bar
//     doc.rect(0, 0, pageWidth, 6).fill(accentRed);

//     // Logo (increased size)
//     doc.image(LOGO_PATH, leftMargin, 10, { width: 55, height: 55 });

//     // Company name and title
//     doc
//       .fillColor(accentRed)
//       .font("Helvetica-Bold")
//       .fontSize(20)
//       .text("Life Care", leftMargin + 70, 14, { continued: false });

//     doc
//       .fillColor(primaryBlue)
//       .fontSize(20)
//       .text("Diagnostic", leftMargin + 160, 14, { continued: false });

//     doc
//       .fillColor(textDark)
//       .fontSize(11)
//       .font("Helvetica")
//       .text("Clinical Laboratory", leftMargin + 70, 40, { continued: false });

//     // Right side header info
//     doc
//       .fontSize(7)
//       .fillColor(textDark)
//       .font("Helvetica")
//       .text(
//         "Fully Automated Computerized Clinical Lab\nHealth Checkup • ECG • Home Visit • Sunday\nOpen\nDigital X-Ray • ECG",
//         rightMargin - 160,
//         14,
//         { width: 160, align: "right", lineGap: 1 },
//       );

//     // Blue bar with "LABORATORY REPORT"
//     doc.rect(rightMargin - 160, 48, 160, 14).fill(primaryBlue);
//     doc
//       .fillColor("white")
//       .font("Helvetica-Bold")
//       .fontSize(9)
//       .text("LABORATORY REPORT", rightMargin - 160, 52, {
//         width: 160,
//         align: "center",
//       });

//     doc
//       .strokeColor(borderGray)
//       .lineWidth(1)
//       .moveTo(leftMargin, 70)
//       .lineTo(rightMargin, 70)
//       .stroke();
//   };

//   // Function to add patient info
//   const addPatientInfo = () => {
//     let infoY = 78;

//     // Patient info box
//     doc.rect(leftMargin, infoY, contentWidth, 62).strokeColor(borderGray).stroke();

//     doc.fontSize(7).font("Helvetica-Bold").fillColor(textDark);

//     const infoLeftX = leftMargin + 8;
//     const infoRightX = pageWidth / 2 + 8;
//     let leftY = infoY + 6;
//     let rightY = infoY + 6;

//     // Left column
//     doc.text("Patient Name :", infoLeftX, leftY);
//     doc
//       .font("Helvetica")
//       .text(
//         order.patientId?.fullName?.toUpperCase() || "N/A",
//         infoLeftX + 70,
//         leftY,
//       );

//     leftY += 12;
//     doc.font("Helvetica-Bold").text("Age / Sex :", infoLeftX, leftY);
//     doc
//       .font("Helvetica")
//       .text(
//         `${order.patientId?.age || "N/A"} / ${order.patientId?.gender || "N/A"}`,
//         infoLeftX + 70,
//         leftY,
//       );

//     leftY += 12;
//     doc.font("Helvetica-Bold").text("Contact No. :", infoLeftX, leftY);
//     doc
//       .font("Helvetica")
//       .text(order.patientId?.phone || "N/A", infoLeftX + 70, leftY);

//     leftY += 12;
//     doc.font("Helvetica-Bold").text("Referred By :", infoLeftX, leftY);
//     doc
//       .font("Helvetica")
//       .text(order.doctor?.name || "SELF", infoLeftX + 70, leftY);

//     // Right column
//     doc.font("Helvetica-Bold").text("Patient ID :", infoRightX, rightY);
//     doc
//       .font("Helvetica")
//       .text(order.patientId?.patientId || "N/A", infoRightX + 95, rightY);

//     rightY += 12;
//     doc.font("Helvetica-Bold").text("Ref. Date & Time :", infoRightX, rightY);
//     doc
//       .font("Helvetica")
//       .text(
//         new Date(order.orderDate).toLocaleString("en-IN", {
//           day: "2-digit",
//           month: "2-digit",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: false
//         }),
//         infoRightX + 95,
//         rightY,
//       );

//     rightY += 12;
//     doc.font("Helvetica-Bold").text("Reporting At Time :", infoRightX, rightY);
//     doc
//       .font("Helvetica")
//       .text(
//         new Date().toLocaleString("en-IN", {
//           day: "2-digit",
//           month: "2-digit",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: false
//         }),
//         infoRightX + 95,
//         rightY,
//       );

//     rightY += 12;
//     doc.font("Helvetica-Bold").text("Collection Date & Time :", infoRightX, rightY);
//     doc
//       .font("Helvetica")
//       .text(
//         new Date(order.orderDate).toLocaleString("en-IN", {
//           day: "2-digit",
//           month: "2-digit",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: false
//         }),
//         infoRightX + 95,
//         rightY,
//       );

//     return infoY + 74;
//   };

//   // Function to add footer
//   const addFooter = () => {
//     const footerY = pageHeight - 100;

//     // Explicitly position cursor to footer area to prevent page breaks
//     doc.y = footerY;

//     // Signature section
//     doc
//       .font("Helvetica")
//       .fontSize(7)
//       .fillColor(textGray)
//       .text("Signature", leftMargin + 60, footerY);

//     doc.text("Signature", rightMargin - 100, footerY);

//     // Names and designations
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(7)
//       .fillColor(textDark)
//       .text("Mr. Mayank Patil", leftMargin + 40, footerY + 20);

//     doc.text("Dr. A. Meshay", rightMargin - 110, footerY + 20);

//     doc
//       .font("Helvetica")
//       .fontSize(6.5)
//       .fillColor(textGray)
//       .text("M.Sc. (Medical Biochemist)", leftMargin + 25, footerY + 30);

//     doc.text("M.D Pathology", rightMargin - 105, footerY + 30);

//     doc
//       .fontSize(6.5)
//       .text("Lab. Technician", leftMargin + 45, footerY + 38);

//     doc.text("Reg. No. MCI - 12345", rightMargin - 115, footerY + 38);

//     // Bottom blue bar with contact info
//     const bottomBarY = pageHeight - 45;
//     doc.rect(0, bottomBarY, pageWidth, 45).fill(primaryBlue);

//     doc
//       .fillColor("white")
//       .fontSize(6.5)
//       .font("Helvetica")
//       .text(
//         "Address: Shop No.3, Yamuna Nagar, Nigdi, Pune - 411044",
//         leftMargin,
//         bottomBarY + 8,
//         { width: contentWidth, align: "center" }
//       );

//     doc
//       .fontSize(6)
//       .text(
//         "● Please note that's collection & Technical fees non-refundable ● Please Collect Your Reports Within 15 Days",
//         leftMargin,
//         bottomBarY + 18,
//         { width: contentWidth, align: "center" }
//       );

//     doc
//       .fontSize(6.5)
//       .text(
//         "● 9422315409 ● 8380097359 ● lifecarediagnostic29@gmail.com",
//         leftMargin,
//         bottomBarY + 28,
//         { width: contentWidth, align: "center" }
//       );
//   };

//   // Function to add table header
//   const addTableHeader = (y) => {
//     doc.rect(leftMargin, y, contentWidth, 14).fill("#e8eaf6");
//     doc.fillColor(textDark).font("Helvetica-Bold").fontSize(7);

//     doc.text("TEST", leftMargin + 6, y + 4, { width: 200 });
//     doc.text("RESULT", leftMargin + 240, y + 4, { width: 60, align: "center" });
//     doc.text("UNIT", leftMargin + 320, y + 4, { width: 60, align: "center" });
//     doc.text("BIOLOGICAL REF RANGE", leftMargin + 400, y + 4);

//     return y + 14;
//   };

//   // Function to draw vertical table borders
//   const drawTableBorders = (startY, endY) => {
//     doc.strokeColor(borderGray).lineWidth(0.5);
//     doc.moveTo(leftMargin, startY).lineTo(leftMargin, endY).stroke();
//     doc.moveTo(leftMargin + 235, startY).lineTo(leftMargin + 235, endY).stroke();
//     doc.moveTo(leftMargin + 315, startY).lineTo(leftMargin + 315, endY).stroke();
//     doc.moveTo(leftMargin + 395, startY).lineTo(leftMargin + 395, endY).stroke();
//     doc.moveTo(rightMargin, startY).lineTo(rightMargin, endY).stroke();
//   };

//   // Function to check if new page is needed
//   const checkPageBreak = (requiredSpace) => {
//     if (currentY + requiredSpace > maxContentY) {
//       doc.addPage();
//       currentPage++;
//       addHeader();
//       currentY = 78;
//       return true;
//     }
//     return false;
//   };

//   /* ================= START DOCUMENT ================= */

//   addHeader();
//   currentY = addPatientInfo();

//   /* ================= HAEMATOLOGY SECTION ================= */

//   doc
//     .fillColor(textDark)
//     .font("Helvetica-Bold")
//     .fontSize(9)
//     .text("HAEMATOLOGY", leftMargin, currentY, { lineBreak: false });

//   currentY += 14;

//   const tableStartY = currentY;
//   currentY = addTableHeader(currentY);

//   /* ===== RENDER ALL TESTS ===== */
//   const tests = order.tests || [];

//   tests.forEach((test, testIndex) => {
//     // Calculate required space for this test
//     const testRowHeight = 12;
//     const paramRowHeight = 12;
//     const paramCount = test.results?.length || 0;
//     const totalTestHeight = testRowHeight + (paramCount * paramRowHeight);

//     // Check if we need a new page for the entire test
//     // +14 for potential table header space on new page
//     if (checkPageBreak(totalTestHeight + 14)) {
//       // Add table header on new page
//       currentY = addTableHeader(currentY);
//     }

//     const testSectionStart = currentY;

//     // Main test name row
//     doc.rect(leftMargin, currentY, contentWidth, testRowHeight).fill("#fafafa");
//     doc.strokeColor(borderGray).lineWidth(0.5);
//     doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

//     doc
//       .fillColor(textDark)
//       .font("Helvetica-Bold")
//       .fontSize(7.5)
//       .text(
//         test.testName || test.testId?.testName || "Test",
//         leftMargin + 6,
//         currentY + 3.5,
//         { width: 225, align: "left" }
//       );

//     currentY += testRowHeight;

//     // Parameters
//     if (test.results && test.results.length > 0) {
//       test.results.forEach((param, paramIndex) => {
//         // No need to check page break here - already checked for entire test above

//         // Alternate row background
//         if (paramIndex % 2 === 1) {
//           doc.rect(leftMargin, currentY, contentWidth, paramRowHeight).fill("#ffffff");
//         } else {
//           doc.rect(leftMargin, currentY, contentWidth, paramRowHeight).fill("#fafafa");
//         }

//         // Horizontal line
//         doc.strokeColor(borderGray).lineWidth(0.5);
//         doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

//         // Parameter name (indented)
//         doc
//           .fillColor(textDark)
//           .font("Helvetica")
//           .fontSize(7)
//           .text(param.parameterName || "-", leftMargin + 20, currentY + 3.5, {
//             width: 210,
//           });

//         // Result value (centered)
//         doc
//           .fillColor(textDark)
//           .font("Helvetica-Bold")
//           .fontSize(7)
//           .text(param.value || "-", leftMargin + 240, currentY + 3.5, {
//             width: 70,
//             align: "center"
//           });

//         // Unit (centered)
//         doc
//           .fillColor(textDark)
//           .font("Helvetica")
//           .fontSize(7)
//           .text(param.unit || "-", leftMargin + 320, currentY + 3.5, {
//             width: 70,
//             align: "center"
//           });

//         // Reference range
//         let refRange = "-";
//         if (param.referenceRange) {
//           if (
//             typeof param.referenceRange === "object" &&
//             param.referenceRange !== null
//           ) {
//             refRange = `${param.referenceRange.min || ""} - ${param.referenceRange.max || ""}`;
//           } else {
//             refRange = param.referenceRange;
//           }
//         }
//         doc
//           .fillColor(textDark)
//           .fontSize(7)
//           .text(refRange, leftMargin + 400, currentY + 3.5, {
//             width: 115,
//           });

//         currentY += paramRowHeight;
//       });
//     }

//     // Bottom border of test section
//     doc.strokeColor(borderGray).lineWidth(0.5);
//     doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

//     // Draw vertical borders for this test section
//     drawTableBorders(testSectionStart, currentY);
//   });

//   // Draw table header borders
//   drawTableBorders(tableStartY, tableStartY + 14);

//   /* ================= ADD FOOTER TO FINAL PAGE ================= */
//   addFooter();
// };

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
  const footerHeight = 155;
  const maxContentY = pageHeight - footerHeight;

  let currentY = 0;
  let currentPage = 1;

  // Function to add watermark
  const addWatermark = () => {
    const watermarkSize = 300;
    const watermarkX = (pageWidth - watermarkSize) / 2;
    const watermarkY = (pageHeight - watermarkSize) / 2;

    doc.save();
    doc.opacity(0.05);
    doc.image(LOGO_PATH, watermarkX, watermarkY, {
      width: watermarkSize,
      height: watermarkSize
    });
    doc.restore();
  };

  // Function to add header
  const addHeader = () => {
    // Logo on left (increased size)
    doc.image(LOGO_PATH, leftMargin, 15, { width: 80, height: 80 });

    // Company name "Life Care" in red and "Diagnostic" in blue
    doc
      .fillColor(accentRed)
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("Life Care", leftMargin + 95, 25, { continued: false });

    doc
      .fillColor(darkBlue)
      .fontSize(24)
      .text("Diagnostic", leftMargin + 95, 48, { continued: false });

    // Right side header info - "Clinical Laboratory"
    const rightTextX = rightMargin - 200;

    doc
      .fillColor(darkBlue)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Clinical Laboratory", rightTextX, 20, {
        width: 200,
        align: "left"
      });

    // Bullet points for services
    doc
      .fillColor(accentRed)
      .fontSize(8)
      .font("Helvetica")
      .text("● ", rightTextX, 35, { continued: true })
      .fillColor(textDark)
      .text("Fully Automated Computerized Clinical Lab", { continued: false });

    doc
      .fillColor(accentRed)
      .fontSize(8)
      .text("● ", rightTextX, 45, { continued: true })
      .fillColor(textDark)
      .text("Health Check up for company, ● ECG", { continued: false });

    doc
      .fillColor(accentRed)
      .fontSize(8)
      .text("● ", rightTextX, 55, { continued: true })
      .fillColor(textDark)
      .text("Home Visit ● Sunday Open", { continued: false });

    // "LABORATORY TEST REPORT" text on right side
    doc
      .fillColor("#cccccc")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("L", rightMargin - 25, 110, { align: "center" });
    doc.text("A", rightMargin - 25, 122, { align: "center" });
    doc.text("B", rightMargin - 25, 134, { align: "center" });
    doc.text("O", rightMargin - 25, 146, { align: "center" });
    doc.text("R", rightMargin - 25, 158, { align: "center" });
    doc.text("A", rightMargin - 25, 170, { align: "center" });
    doc.text("T", rightMargin - 25, 182, { align: "center" });
    doc.text("O", rightMargin - 25, 194, { align: "center" });
    doc.text("R", rightMargin - 25, 206, { align: "center" });
    doc.text("Y", rightMargin - 25, 218, { align: "center" });
    doc.fontSize(8);
    doc.text("T", rightMargin - 25, 240, { align: "center" });
    doc.text("E", rightMargin - 25, 250, { align: "center" });
    doc.text("S", rightMargin - 25, 260, { align: "center" });
    doc.text("T", rightMargin - 25, 270, { align: "center" });
    doc.fontSize(10);
    doc.text("R", rightMargin - 25, 290, { align: "center" });
    doc.text("E", rightMargin - 25, 302, { align: "center" });
    doc.text("P", rightMargin - 25, 314, { align: "center" });
    doc.text("O", rightMargin - 25, 326, { align: "center" });
    doc.text("R", rightMargin - 25, 338, { align: "center" });
    doc.text("T", rightMargin - 25, 350, { align: "center" });

    // Horizontal line below header
    doc
      .strokeColor(borderGray)
      .lineWidth(1)
      .moveTo(leftMargin, 100)
      .lineTo(rightMargin, 100)
      .stroke();
  };

  // Function to add patient info
  const addPatientInfo = () => {
    let infoY = 108;

    // Patient info box
    doc.rect(leftMargin, infoY, contentWidth, 62).strokeColor(borderGray).stroke();

    doc.fontSize(7).font("Helvetica-Bold").fillColor(textDark);

    const infoLeftX = leftMargin + 8;
    const infoRightX = pageWidth / 2 + 8;
    let leftY = infoY + 6;
    let rightY = infoY + 6;

    // Left column
    doc.text("Patient Name :", infoLeftX, leftY);
    doc
      .font("Helvetica")
      .text(
        order.patientId?.fullName?.toUpperCase() || "N/A",
        infoLeftX + 70,
        leftY,
      );

    leftY += 12;
    doc.font("Helvetica-Bold").text("Age / Sex :", infoLeftX, leftY);
    doc
      .font("Helvetica")
      .text(
        `${order.patientId?.age || "N/A"} / ${order.patientId?.gender || "N/A"}`,
        infoLeftX + 70,
        leftY,
      );

    leftY += 12;
    doc.font("Helvetica-Bold").text("Contact No. :", infoLeftX, leftY);
    doc
      .font("Helvetica")
      .text(order.patientId?.phone || "N/A", infoLeftX + 70, leftY);

    leftY += 12;
    doc.font("Helvetica-Bold").text("Referred By :", infoLeftX, leftY);
    doc
      .font("Helvetica")
      .text(order.doctor?.name || "SELF", infoLeftX + 70, leftY);

    // Right column
    doc.font("Helvetica-Bold").text("Patient ID :", infoRightX, rightY);
    doc
      .font("Helvetica")
      .text(order.patientId?.patientId || "N/A", infoRightX + 95, rightY);

    rightY += 12;
    doc.font("Helvetica-Bold").text("Ref. Date & Time :", infoRightX, rightY);
    doc
      .font("Helvetica")
      .text(
        new Date(order.orderDate).toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }),
        infoRightX + 95,
        rightY,
      );

    rightY += 12;
    doc.font("Helvetica-Bold").text("Reporting At Time :", infoRightX, rightY);
    doc
      .font("Helvetica")
      .text(
        new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }),
        infoRightX + 95,
        rightY,
      );

    rightY += 12;
    doc.font("Helvetica-Bold").text("Collection Date & Time :", infoRightX, rightY);
    doc
      .font("Helvetica")
      .text(
        new Date(order.orderDate).toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }),
        infoRightX + 95,
        rightY,
      );

    return infoY + 74;
  };

  // Function to add footer
  const addFooter = () => {
    const footerY = pageHeight - 145;

    // Explicitly position cursor to footer area to prevent page breaks
    doc.y = footerY;

    // Signature section
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(textGray)
      .text("Signature", leftMargin + 60, footerY);

    doc.text("Signature", rightMargin - 100, footerY);

    // Names and designations
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(textDark)
      .text("Mr. Mayank Patil", leftMargin + 40, footerY + 20);

    doc.text("Dr. A. Meshay", rightMargin - 110, footerY + 20);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(textGray)
      .text("M.Sc. (Medical Biochemist)", leftMargin + 30, footerY + 32);

    doc.text("M.D Pathology", rightMargin - 105, footerY + 32);

    doc
      .fontSize(7)
      .text("Lab. Technician", leftMargin + 50, footerY + 42);

    doc.text("Reg. No. MCI - 12345", rightMargin - 115, footerY + 42);

    // Bottom section
    const bottomBarY = pageHeight - 85;

    // Registration number centered above the line
    doc
      .fillColor(primaryBlue)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(
        "Reg No : QMS/22N2251",
        leftMargin,
        bottomBarY - 10,
        { width: contentWidth, align: "center" }
      );

    // Top horizontal line
    doc
      .strokeColor("#000000")
      .lineWidth(1.5)
      .moveTo(leftMargin, bottomBarY)
      .lineTo(rightMargin, bottomBarY)
      .stroke();

    // Address line with inline formatting
    const addressY = bottomBarY + 6;
    let currentX = leftMargin;

    // "Add :"
    doc
      .fillColor(textDark)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("Add : ", currentX, addressY);
    currentX += doc.widthOfString("Add : ");

    // Address in red
    doc
      .fillColor(accentRed)
      .font("Helvetica")
      .text("Ganga Bhavan Bldg. Navin Posari Road, Mohopada  ", currentX, addressY);
    currentX += doc.widthOfString("Ganga Bhavan Bldg. Navin Posari Road, Mohopada  ");

    // Phone with green icon
    doc
      .fillColor("#4caf50")
      .fontSize(8)
      .text("📞", currentX, addressY);
    currentX += doc.widthOfString("📞");

    doc
      .fillColor(textDark)
      .fontSize(7.5)
      .text(": ", currentX, addressY);
    currentX += doc.widthOfString(": ");

    doc
      .fillColor(accentRed)
      .text("8805085771  ", currentX, addressY);
    currentX += doc.widthOfString("8805085771  ");

    // WhatsApp with green icon
    doc
      .fillColor("#4caf50")
      .fontSize(8)
      .text("💬", currentX, addressY);
    currentX += doc.widthOfString("💬");

    doc
      .fillColor(textDark)
      .fontSize(7.5)
      .text(": ", currentX, addressY);
    currentX += doc.widthOfString(": ");

    doc
      .fillColor(accentRed)
      .text("9702111223  ", currentX, addressY);
    currentX += doc.widthOfString("9702111223  ");

    // Email with blue icon
    doc
      .fillColor(primaryBlue)
      .fontSize(8)
      .text("✉", currentX, addressY);
    currentX += doc.widthOfString("✉");

    doc
      .fillColor(textDark)
      .fontSize(7.5)
      .text(": ", currentX, addressY);
    currentX += doc.widthOfString(": ");

    doc
      .fillColor(primaryBlue)
      .text("lifecare.rasayani@gmail.com", currentX, addressY);

    // First disclaimer line
    const disclaimer1Y = addressY + 12;

    doc
      .fillColor("#00bcd4")
      .fontSize(7)
      .font("Helvetica")
      .text("● ", leftMargin, disclaimer1Y);

    doc
      .fillColor(textDark)
      .text("These are only Laboratory & Technical Test Results.", leftMargin + 8, disclaimer1Y);

    // Right side of first line
    const midPoint = pageWidth / 2 + 20;
    doc
      .fillColor("#00bcd4")
      .text("● ", midPoint, disclaimer1Y);

    doc
      .fillColor(textDark)
      .text("These are not Medical Diagnostic Result in any case and purpose.", midPoint + 8, disclaimer1Y);

    // Second disclaimer line
    const disclaimer2Y = disclaimer1Y + 10;

    doc
      .fillColor("#00bcd4")
      .text("● ", leftMargin, disclaimer2Y);

    doc
      .fillColor(textDark)
      .text("Unexpected result should be confirmed with fresh specimen.", leftMargin + 8, disclaimer2Y);

    // Right side of second line
    doc
      .fillColor("#00bcd4")
      .text("● ", midPoint, disclaimer2Y);

    doc
      .fillColor(textDark)
      .text("Laboratory Test result should be Interpreted In Correlation with clinical finding.", midPoint + 8, disclaimer2Y);

    // Bottom black bar
    const blackBarY = pageHeight - 30;
    doc.rect(0, blackBarY, pageWidth, 30).fill("#000000");

    // Beti Bachao Beti Padhao text in white on black background
    doc
      .fillColor("#ffffff")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(
        "बेटी बचाओ बेटी पढ़ाओ",
        leftMargin,
        blackBarY + 10,
        { width: contentWidth, align: "center" }
      );
  };

  // Function to add table header
  const addTableHeader = (y) => {
    doc.rect(leftMargin, y, contentWidth, 14).fill("#e8eaf6");
    doc.fillColor(textDark).font("Helvetica-Bold").fontSize(7);

    doc.text("TEST", leftMargin + 6, y + 4, { width: 200 });
    doc.text("RESULT", leftMargin + 240, y + 4, { width: 60, align: "center" });
    doc.text("UNIT", leftMargin + 320, y + 4, { width: 60, align: "center" });
    doc.text("BIOLOGICAL REF RANGE", leftMargin + 400, y + 4);

    return y + 14;
  };

  // Function to draw vertical table borders
  const drawTableBorders = (startY, endY) => {
    doc.strokeColor(borderGray).lineWidth(0.5);
    doc.moveTo(leftMargin, startY).lineTo(leftMargin, endY).stroke();
    doc.moveTo(leftMargin + 235, startY).lineTo(leftMargin + 235, endY).stroke();
    doc.moveTo(leftMargin + 315, startY).lineTo(leftMargin + 315, endY).stroke();
    doc.moveTo(leftMargin + 395, startY).lineTo(leftMargin + 395, endY).stroke();
    doc.moveTo(rightMargin, startY).lineTo(rightMargin, endY).stroke();
  };

  // Function to check if new page is needed
  const checkPageBreak = (requiredSpace) => {
    if (currentY + requiredSpace > maxContentY) {
      doc.addPage();
      currentPage++;
      addWatermark();
      addHeader();
      currentY = 108;
      return true;
    }
    return false;
  };

  /* ================= START DOCUMENT ================= */

  addWatermark();
  addHeader();
  currentY = addPatientInfo();

  /* ================= HAEMATOLOGY SECTION ================= */

  doc
    .fillColor(textDark)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("HAEMATOLOGY", leftMargin, currentY, { lineBreak: false });

  currentY += 14;

  const tableStartY = currentY;
  currentY = addTableHeader(currentY);

  /* ===== RENDER ALL TESTS ===== */
  const tests = order.tests || [];

  tests.forEach((test, testIndex) => {
    // Calculate required space for this test
    const testRowHeight = 12;
    const paramRowHeight = 12;
    const paramCount = test.results?.length || 0;
    const totalTestHeight = testRowHeight + (paramCount * paramRowHeight);

    // Check if we need a new page for the entire test
    // +14 for potential table header space on new page
    if (checkPageBreak(totalTestHeight + 14)) {
      // Add table header on new page
      currentY = addTableHeader(currentY);
    }

    const testSectionStart = currentY;

    // Main test name row
    doc.rect(leftMargin, currentY, contentWidth, testRowHeight).fill("#fafafa");
    doc.strokeColor(borderGray).lineWidth(0.5);
    doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

    doc
      .fillColor(textDark)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(
        test.testName || test.testId?.testName || "Test",
        leftMargin + 6,
        currentY + 3.5,
        { width: 225, align: "left" }
      );

    currentY += testRowHeight;

    // Parameters
    if (test.results && test.results.length > 0) {
      test.results.forEach((param, paramIndex) => {
        // No need to check page break here - already checked for entire test above

        // Alternate row background
        if (paramIndex % 2 === 1) {
          doc.rect(leftMargin, currentY, contentWidth, paramRowHeight).fill("#ffffff");
        } else {
          doc.rect(leftMargin, currentY, contentWidth, paramRowHeight).fill("#fafafa");
        }

        // Horizontal line
        doc.strokeColor(borderGray).lineWidth(0.5);
        doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

        // Parameter name (indented)
        doc
          .fillColor(textDark)
          .font("Helvetica")
          .fontSize(7)
          .text(param.parameterName || "-", leftMargin + 20, currentY + 3.5, {
            width: 210,
          });

        // Result value (centered)
        doc
          .fillColor(textDark)
          .font("Helvetica-Bold")
          .fontSize(7)
          .text(param.value || "-", leftMargin + 240, currentY + 3.5, {
            width: 70,
            align: "center"
          });

        // Unit (centered)
        doc
          .fillColor(textDark)
          .font("Helvetica")
          .fontSize(7)
          .text(param.unit || "-", leftMargin + 320, currentY + 3.5, {
            width: 70,
            align: "center"
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
        doc
          .fillColor(textDark)
          .fontSize(7)
          .text(refRange, leftMargin + 400, currentY + 3.5, {
            width: 115,
          });

        currentY += paramRowHeight;
      });
    }

    // Bottom border of test section
    doc.strokeColor(borderGray).lineWidth(0.5);
    doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

    // Draw vertical borders for this test section
    drawTableBorders(testSectionStart, currentY);
  });

  // Draw table header borders
  drawTableBorders(tableStartY, tableStartY + 14);

  /* ================= ADD FOOTER TO FINAL PAGE ================= */
  addFooter();
};

export const generateDoctorCommissionReportPDF = (
  doc,
  data,
  doctorName,
  startDate,
  endDate,
) => {
  /* ═══════════════════════════════════════════════
   *  Color Palette
   * ═══════════════════════════════════════════════ */
  const primary = "#1565c0";   // Deep blue
  const primaryDk = "#0d47a1";   // Darker blue
  const accent = "#e8eaf6";   // Light indigo bg
  const textDark = "#1a1a2e";
  const textMuted = "#607d8b";
  const success = "#2e7d32";   // Green for money
  const white = "#ffffff";
  const rowAlt = "#f8f9ff";   // Alternating row bg
  const borderLt = "#c5cae9";

  const pageW = doc.page.width;
  const margin = 40;
  const contentW = pageW - margin * 2;

  /* ─── Helper: rounded rect ─── */
  const roundRect = (x, y, w, h, r, fill, stroke) => {
    doc.roundedRect(x, y, w, h, r);
    if (fill) doc.fill(fill);
    if (stroke) { doc.roundedRect(x, y, w, h, r); doc.strokeColor(stroke).lineWidth(0.5).stroke(); }
  };

  /* ═══════════════════════════════════════════════
   *  1. HEADER — Title bar
   * ═══════════════════════════════════════════════ */
  // Blue header banner
  doc.rect(0, 0, pageW, 80).fill(primary);

  doc.font("Helvetica-Bold").fontSize(22).fillColor(white);
  doc.text("Doctor Commission Report", margin, 20, { width: contentW, align: "center" });

  // Period subtitle
  const periodText = (startDate && endDate)
    ? `${new Date(startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}  —  ${new Date(endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
    : "All Time";
  doc.font("Helvetica").fontSize(10).fillColor("#bbdefb");
  doc.text(periodText, margin, 50, { width: contentW, align: "center" });

  /* ═══════════════════════════════════════════════
   *  2. DOCTOR INFO CARD
   * ═══════════════════════════════════════════════ */
  const cardY = 95;
  roundRect(margin, cardY, contentW, 50, 8, accent, borderLt);

  // Blue left accent bar
  doc.rect(margin, cardY, 5, 50).fill(primary);

  doc.font("Helvetica-Bold").fontSize(14).fillColor(textDark);
  doc.text(doctorName, margin + 20, cardY + 10, { width: contentW - 40 });

  doc.font("Helvetica").fontSize(9).fillColor(textMuted);
  doc.text("Referring Doctor", margin + 20, cardY + 30, { width: 200 });

  // Generated date (right side)
  doc.font("Helvetica").fontSize(8).fillColor(textMuted);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}`,
    margin, cardY + 17,
    { width: contentW - 20, align: "right" }
  );

  /* ═══════════════════════════════════════════════
   *  3. SUMMARY STATISTICS BOXES
   * ═══════════════════════════════════════════════ */
  // Calculate totals
  let totalCommission = 0;
  let totalBillAmount = 0;
  data.forEach((item) => {
    totalCommission += item.commissionAmount || 0;
    totalBillAmount += item.totalBillAmount || 0;
  });
  const totalBills = data.length;

  const statsY = 160;
  const boxW = (contentW - 20) / 3;  // 3 boxes with gaps

  // Box 1: Total Bills
  roundRect(margin, statsY, boxW, 60, 6, white, borderLt);
  doc.font("Helvetica").fontSize(8).fillColor(textMuted);
  doc.text("TOTAL BILLS", margin + 12, statsY + 10, { width: boxW - 24 });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(primary);
  doc.text(`${totalBills}`, margin + 12, statsY + 26, { width: boxW - 24 });

  // Box 2: Total Business
  const box2X = margin + boxW + 10;
  roundRect(box2X, statsY, boxW, 60, 6, white, borderLt);
  doc.font("Helvetica").fontSize(8).fillColor(textMuted);
  doc.text("TOTAL BUSINESS", box2X + 12, statsY + 10, { width: boxW - 24 });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(textDark);
  doc.text(`Rs.${totalBillAmount.toLocaleString("en-IN")}`, box2X + 12, statsY + 26, { width: boxW - 24 });

  // Box 3: Total Commission
  const box3X = margin + (boxW + 10) * 2;
  roundRect(box3X, statsY, boxW, 60, 6, "#e8f5e9", "#a5d6a7");
  doc.font("Helvetica").fontSize(8).fillColor(success);
  doc.text("TOTAL COMMISSION", box3X + 12, statsY + 10, { width: boxW - 24 });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(success);
  doc.text(`Rs.${totalCommission.toLocaleString("en-IN")}`, box3X + 12, statsY + 26, { width: boxW - 24 });

  /* ═══════════════════════════════════════════════
   *  4. DATA TABLE
   * ═══════════════════════════════════════════════ */
  const tableStartY = 240;
  const tableRight = margin + contentW; // right edge of table
  const colW = {
    sno: 25, date: 65, patient: 110, tests: 145, bill: 65, comm: 65
  };
  // Calculate colX so that bill + comm end exactly at tableRight
  const colX = {
    sno: margin,
    date: margin + colW.sno,
    patient: margin + colW.sno + colW.date,
    tests: margin + colW.sno + colW.date + colW.patient,
    bill: tableRight - colW.comm - colW.bill,
    comm: tableRight - colW.comm,
  };
  const rowH = 22;
  const headerH = 28;

  /* Helper to draw the table header */
  const drawTableHeader = (y) => {
    // Blue header background
    doc.rect(margin, y, contentW, headerH).fill(primary);

    doc.font("Helvetica-Bold").fontSize(8).fillColor(white);
    const hY = y + 9;
    doc.text("#", colX.sno, hY, { width: colW.sno, align: "center" });
    doc.text("DATE", colX.date, hY, { width: colW.date });
    doc.text("PATIENT NAME", colX.patient, hY, { width: colW.patient });
    doc.text("TESTS", colX.tests, hY, { width: colW.tests });
    doc.text("BILL AMT", colX.bill, hY, { width: colW.bill, align: "right" });
    doc.text("COMMISSION", colX.comm, hY, { width: colW.comm, align: "right" });

    return y + headerH;
  };

  let currentY = drawTableHeader(tableStartY);
  let rowIndex = 0;

  /* ─── Render each data row ─── */
  data.forEach((item, idx) => {
    const patientName = item.patientName || "N/A";
    const testList = item.testOrder || "N/A";

    // Calculate dynamic row height
    const testTextH = doc.font("Helvetica").fontSize(8).heightOfString(testList, { width: colW.tests - 4 });
    const patientTextH = doc.heightOfString(patientName, { width: colW.patient - 4 });
    const dynamicH = Math.max(testTextH, patientTextH, 14) + 10;

    // Page break check
    if (currentY + dynamicH > doc.page.height - 80) {
      doc.addPage();
      currentY = 40;
      currentY = drawTableHeader(currentY);
      rowIndex = 0;
    }

    // Alternating row background
    const bgColor = rowIndex % 2 === 0 ? white : rowAlt;
    doc.rect(margin, currentY, contentW, dynamicH).fill(bgColor);

    // Row border (bottom)
    doc.lineWidth(0.3).strokeColor(borderLt)
      .moveTo(margin, currentY + dynamicH)
      .lineTo(margin + contentW, currentY + dynamicH)
      .stroke();

    const textY = currentY + 5;
    doc.font("Helvetica").fontSize(8).fillColor(textMuted);
    doc.text(`${idx + 1}`, colX.sno, textY, { width: colW.sno, align: "center" });

    doc.fillColor(textDark);
    doc.text(
      new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
      colX.date, textY, { width: colW.date }
    );

    doc.font("Helvetica-Bold").fontSize(8).fillColor(textDark);
    doc.text(patientName, colX.patient, textY, { width: colW.patient });

    doc.font("Helvetica").fontSize(7.5).fillColor(textMuted);
    doc.text(testList, colX.tests, textY, { width: colW.tests });

    doc.font("Helvetica").fontSize(8).fillColor(textDark);
    doc.text(`Rs.${(item.totalBillAmount || 0).toLocaleString("en-IN")}`, colX.bill, textY, {
      width: colW.bill, align: "right"
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor(success);
    doc.text(`Rs.${(item.commissionAmount || 0).toLocaleString("en-IN")}`, colX.comm, textY, {
      width: colW.comm, align: "right"
    });

    currentY += dynamicH;
    rowIndex++;
  });

  /* ═══════════════════════════════════════════════
   *  5. TOTAL ROW — Highlighted
   * ═══════════════════════════════════════════════ */
  const totalRowH = 32;
  if (currentY + totalRowH > doc.page.height - 80) {
    doc.addPage();
    currentY = 40;
  }

  // Green total row background
  roundRect(margin, currentY + 5, contentW, totalRowH, 6, "#e8f5e9");

  doc.font("Helvetica-Bold").fontSize(10).fillColor(textDark);
  doc.text("TOTAL", margin + 15, currentY + 15);

  doc.font("Helvetica-Bold").fontSize(10).fillColor(textDark);
  doc.text(`Rs.${totalBillAmount.toLocaleString("en-IN")}`, colX.bill, currentY + 15, {
    width: colW.bill, align: "right"
  });

  doc.font("Helvetica-Bold").fontSize(11).fillColor(success);
  doc.text(`Rs.${totalCommission.toLocaleString("en-IN")}`, colX.comm, currentY + 14, {
    width: colW.comm, align: "right"
  });

  /* ═══════════════════════════════════════════════
   *  6. FOOTER — Page numbers & branding
   * ═══════════════════════════════════════════════ */
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 40;

    // Subtle line
    doc.lineWidth(0.5).strokeColor(borderLt)
      .moveTo(margin, footerY - 5)
      .lineTo(margin + contentW, footerY - 5)
      .stroke();

    doc.font("Helvetica").fontSize(7).fillColor(textMuted);
    doc.text("Life Care Diagnostic  •  Doctor Commission Report", margin, footerY, { width: contentW / 2 });
    doc.text(`Page ${i + 1} of ${range.count}`, margin, footerY, { width: contentW, align: "right" });
  }
};
