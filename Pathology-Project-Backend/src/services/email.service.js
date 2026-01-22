import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sendReportEmail = async ({ to, pdfPath, patientName }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Life Care Diagnostic" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Laboratory Test Report - Life Care Diagnostic",
    html: `
      <p>Dear ${patientName},</p>
      <p>Your laboratory test report is attached to this email.</p>
      <p><strong>Life Care Diagnostic</strong><br/>
      Clinical Laboratory<br/>
      Thank you for choosing our services.</p>
      <p>Best Regards,<br/><strong>Life Care Diagnostic Team</strong></p>
    `,
    attachments: [
      {
        filename: "Lab_Report.pdf",
        path: pdfPath,
      },
    ],
  });
};
