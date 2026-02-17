// import TestReport from "../models/testReport.model.js"; // consolidated into TestOrder
// ✅ ADDED
import Patient from "../models/patient.model.js";
import LabTest from "../models/labtest.model.js";
import Bill from "../models/bill.model.js";
import Discount from "../models/discount.model.js";
const getDoctorModel = async () =>
  (await import("../models/doctor.model.js")).default;
import { ApiError } from "../utils/ApiError.js";
import TestOrder from "../models/testorder.model.js";
import mongoose from "mongoose";
import { calculateCommissionForBill } from "./commission.service.js";

// Helper function to select appropriate reference range based on patient gender
const selectReferenceRange = (referenceRanges, patientGender) => {
  if (!referenceRanges || !Array.isArray(referenceRanges) || referenceRanges.length === 0) {
    return null;
  }

  // Try to find gender-specific range
  const genderRange = referenceRanges.find(r => r.gender === patientGender);
  if (genderRange) {
    return { min: genderRange.min, max: genderRange.max };
  }

  // Fallback to first range if no gender match
  return { min: referenceRanges[0].min, max: referenceRanges[0].max };
};

/**
 * Build a complete referenceRange object (with displayText) for any resultType.
 * This is stored on each parameter in the test order so the PDF template can display it.
 */
const buildResultReferenceRange = (param, patientGender) => {
  const rt = param.resultType || 'NUMERIC';

  if (rt === 'NUMERIC') {
    const ranges = param.referenceRanges || [];
    const selected = selectReferenceRange(ranges, patientGender);
    const displayText = ranges
      .map(r => `${r.gender}: ${r.min} - ${r.max}`)
      .join(' | ');
    return {
      ...(selected || {}),
      displayText: displayText || (selected ? `${selected.min} - ${selected.max}` : '-'),
    };
  }

  if (rt === 'UNISEX_NUMERIC') {
    const r = param.unisexRange || {};
    return {
      min: r.min,
      max: r.max,
      displayText: (r.min != null && r.max != null) ? `${r.min} - ${r.max}` : '-',
    };
  }

  if (rt === 'COMPARISON') {
    const ranges = param.comparisonRanges || (param.comparisonRange ? [param.comparisonRange] : []);
    const displayText = ranges
      .map(cr => `${cr.gender ? cr.gender + ': ' : ''}${cr.comparator || '<'} ${cr.value}`)
      .join(' | ');
    return { displayText: displayText || '-' };
  }

  if (rt === 'QUALITATIVE') {
    const q = param.qualitativeOptions || {};
    return { displayText: q.normalValue ? `Normal: ${q.normalValue}` : '-' };
  }

  // Fallback for unknown types
  return { displayText: '-' };
};

// Helper to generate Report ID (similar to Patient ID)
const generateReportId = async () => {
  // Use aggregation to compute numeric part and get max
  const res = await TestOrder.aggregate([
    { $match: { reportId: { $exists: true, $ne: "" } } },
    {
      $project: {
        codeStr: "$reportId",
        // Remove REP prefix if present, else keep original
        numericPart: {
          $toInt: {
            $cond: [
              {
                $regexMatch: { input: "$reportId", regex: /^REP(\d+)$/ },
              },
              {
                $replaceOne: {
                  input: "$reportId",
                  find: "REP",
                  replacement: "",
                },
              },
              "0",
            ],
          },
        },
      },
    },
    { $group: { _id: null, maxNum: { $max: "$numericPart" } } },
  ]);

  const maxNumber = res[0]?.maxNum || 99; // default baseline (so first ID is REP100)
  const nextNumber = maxNumber + 1;
  const formatted = String(nextNumber).padStart(3, "0");
  return `REP${formatted}`;
};


// 1. Create Test Order
export const createTestOrder = async ({
  patientId,
  testIds = [],
  packageIds = [],
  doctorId,
  labId,
  discountId
}) => {
  // No transaction for simple single-server setup

  const patient = await Patient.findById(patientId);
  if (!patient) throw new ApiError(404, "Patient not found");

  let doctor = null;
  if (doctorId) {
    const Doctor = await getDoctorModel();
    doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new ApiError(404, "Doctor not found");
  }

  // Fetch individual tests
  const labTests = await LabTest.find({ _id: { $in: testIds } });
  if (testIds.length > 0 && labTests.length !== testIds.length) {
    throw new ApiError(404, "One or more tests not found");
  }

  // Fetch packages
  const TestPackage = (await import("../models/testpackage.model.js")).default;
  const packages = await TestPackage.find({ _id: { $in: packageIds } }).populate('includedTests.testId');
  if (packageIds.length > 0 && packages.length !== packageIds.length) {
    throw new ApiError(404, "One or more packages not found");
  }

  const tests = [];
  const billItems = [];
  let totalAmount = 0;

  // Add individual tests
  for (const labTest of labTests) {
    const initialResults = labTest.parameters.map((param) => ({
      parameterName: param.name,
      value: "",
      unit: param.unit,
      resultType: param.resultType || 'NUMERIC',
      referenceRange: buildResultReferenceRange(param, patient.gender),
    }));

    tests.push({
      testId: labTest._id,
      testName: labTest.testName,
      price: labTest.price || 0,
      status: "PENDING",
      results: initialResults,
    });

    billItems.push({
      name: labTest.testName,
      price: labTest.price || 0,
      testId: labTest._id,
      itemType: "INDIVIDUAL_TEST"
    });

    totalAmount += (labTest.price || 0);
  }

  // Expand packages into tests and add package bill items
  for (const pkg of packages) {
    // Add all tests from the package to the test order
    for (const includedTest of pkg.includedTests) {
      const labTest = includedTest.testId;
      if (!labTest) continue;

      // Check if this test is already added (avoid duplicates)
      const alreadyAdded = tests.find(t => t.testId.toString() === labTest._id.toString());
      if (alreadyAdded) continue;

      const initialResults = labTest.parameters.map((param) => ({
        parameterName: param.name,
        value: "",
        unit: param.unit,
        referenceRange: selectReferenceRange(param.referenceRanges, patient.gender),
      }));

      tests.push({
        testId: labTest._id,
        testName: labTest.testName,
        price: labTest.price || 0,
        status: "PENDING",
        results: initialResults,
        fromPackage: pkg._id, // Track which package this test came from
      });
    }

    // Add package as a single bill item
    billItems.push({
      name: pkg.packageName,
      price: pkg.packagePrice || 0,
      packageId: pkg._id,
      itemType: "PACKAGE",
      includedTestCount: pkg.includedTests.length
    });

    totalAmount += (pkg.packagePrice || 0);
  }

  // Handle Discount
  let discountAmount = 0;
  if (discountId) {
    const discount = await Discount.findById(discountId);
    if (!discount) {
      throw new ApiError(404, "Invalid discount selected");
    }

    // Security & Integrity Checks
    if (discount.labId.toString() !== labId.toString()) {
      throw new ApiError(403, "Unauthorized discount access");
    }
    if (!discount.isActive) {
      throw new ApiError(400, "Selected discount is no longer active");
    }

    if (discount.type === "PERCENT") {
      discountAmount = (totalAmount * discount.value) / 100;
      // Cap at 100%
      if (discountAmount > totalAmount) discountAmount = totalAmount;
    } else if (discount.type === "FLAT") {
      discountAmount = discount.value;
      // Cap at total amount
      if (discountAmount > totalAmount) discountAmount = totalAmount;
    }

    // Ensure positive integers
    discountAmount = Math.round(discountAmount);
  }

  const finalBillAmount = Math.max(0, Math.round(totalAmount - discountAmount));

  // Generate report ID
  const reportId = await generateReportId();

  try {
    const [testOrder] = await TestOrder.create(
      [
        {
          patientId,
          reportId,
          labId,
          doctor: doctorId || undefined,
          tests,
          totalAmount: finalBillAmount,
          discountId: discountId || undefined,
          discountAmount,
          overallStatus: "PENDING",
        },
      ]
    );

    const billService = await import("./bill.service.js");
    const bill = await billService.generateBill(
      {
        patientId,
        testOrderId: testOrder._id,
        items: billItems,
        totalAmount: finalBillAmount,
        discountId: discountId || undefined,
        discountAmount,
        labId,
        referringDoctorId: doctorId
      }
    );

    testOrder.billId = bill._id;
    await testOrder.save();

    return { testOrder, bill };
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ApiError(400, `Validation Error: ${error.message}`);
    }
    throw error;
  }
};

// 8. Update Test Order (Add/Remove Tests)
export const updateTestOrder = async (orderId, { addTestIds = [], removeTestItemIds = [] }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await TestOrder.findById(orderId).session(session);
    if (!order) throw new ApiError(404, "Test Order not found");

    const bill = await Bill.findById(order.billId).session(session);
    if (!bill) throw new ApiError(404, "Associated Bill not found");

    // 1. Remove Tests
    if (removeTestItemIds.length > 0) {
      order.tests = order.tests.filter(t => !removeTestItemIds.includes(t._id.toString()));
    }

    // 2. Add Tests
    if (addTestIds.length > 0) {
      const labTests = await LabTest.find({ _id: { $in: addTestIds } }).session(session);

      const patient = await Patient.findById(order.patientId).session(session);

      for (const labTest of labTests) {
        if (order.tests.some(t => t.testId.toString() === labTest._id.toString())) continue;

        const initialResults = labTest.parameters.map(p => ({
          parameterName: p.name,
          value: "",
          unit: p.unit,
          resultType: p.resultType || 'NUMERIC',
          referenceRange: buildResultReferenceRange(p, patient?.gender)
        }));

        order.tests.push({
          testId: labTest._id,
          testName: labTest.testName,
          price: labTest.price,
          status: "PENDING",
          results: initialResults
        });
      }
    }

    // 3. Recalculate Totals
    const grossTotal = order.tests.reduce((sum, t) => sum + (t.price || 0), 0);
    const netTotal = Math.max(0, grossTotal - (order.discountAmount || 0));

    order.totalAmount = Math.round(netTotal);

    // 4. Update Bill & Recalculate Commissions
    const billItems = [];
    let billCommissionAmount = 0;
    let billCommissionType = "none";

    for (const t of order.tests) {
      const item = {
        name: t.testName,
        price: t.price,
        testId: t.testId
      };

      if (order.doctor) {
        const commData = await calculateCommissionForBill({
          testId: t.testId,
          referringDoctorId: order.doctor,
          totalAmount: t.price || 0
        });

        item.commissionAmount = commData.commissionAmount;
        item.commissionPercentage = commData.commissionPercentage;
        item.commissionType = commData.commissionType;
        billCommissionAmount += commData.commissionAmount;

        if (commData.commissionType === 'specialized') {
          billCommissionType = 'specialized';
        } else if (commData.commissionType === 'generalized' && billCommissionType !== 'specialized') {
          billCommissionType = 'generalized';
        }
      }
      billItems.push(item);
    }

    bill.items = billItems;
    bill.totalAmount = Math.round(netTotal); // Amount after discount (what patient pays before commission)
    bill.commissionAmount = billCommissionAmount;
    bill.commissionType = billCommissionType;

    // Status update logic maintained
    const allComp = order.tests.every(t => t.status === "COMPLETED");
    const anyComp = order.tests.some(t => t.status === "COMPLETED");
    order.overallStatus = allComp ? "COMPLETED" : anyComp ? "PARTIAL" : "PENDING";

    await order.save({ session });
    await bill.save({ session });

    await session.commitTransaction();
    return { order, bill };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


// 2. Add Historical Report
export const addHistoricalReport = async ({
  patientId,
  testName,
  doctorName,
  testDate,
  reportFileUrl,
  labId,
  testId,
}) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new ApiError(404, "Patient not found");

  // Generate report ID for historical report
  const reportId = await generateReportId();

  const report = await TestOrder.create({
    patientId,
    reportId, // Add generated report ID
    labId,
    doctorName: doctorName || "External",
    orderDate: testDate || new Date(),
    overallStatus: "COMPLETED",
    isHistorical: true,
    totalAmount: 0,
    tests: [
      {
        testId: testId || new mongoose.Types.ObjectId(),
        testName,
        status: "COMPLETED",
        reportFileUrl,
        results: [],
      },
    ],
  });
  return report;
};

// Utility for standardized result matching
const findParameterIndex = (results, parameterName) => {
  const normalizedInput = parameterName.trim().toLowerCase();
  return results.findIndex(
    (r) => r.parameterName.trim().toLowerCase() === normalizedInput
  );
};

// 3. Submit Results for Individual Test
export const submitTestResults = async (
  orderId,
  testItemId,
  { results, reportFileUrl, userId } // Added userId for auditing
) => {
  const order = await TestOrder.findById(orderId);
  if (!order) throw new ApiError(404, "Test Order not found");

  let testItem = order.tests.id(testItemId);
  if (!testItem) {
    testItem = order.tests.find((t) => t.testId.toString() === testItemId);
  }

  if (!testItem) throw new ApiError(404, "Test not found in this order");

  // Fetch master LabTest definition to refresh referenceRange with displayText
  let masterDef = null;
  try {
    masterDef = await LabTest.findById(testItem.testId);
  } catch (e) {
    // Non-critical: proceed without refreshing
  }

  // Fetch patient for gender-specific range selection
  let patient = null;
  if (masterDef) {
    try {
      patient = await Patient.findById(order.patientId);
    } catch (e) { /* ignore */ }
  }

  if (results && Array.isArray(results)) {
    results.forEach((inputResult) => {
      const paramIndex = findParameterIndex(testItem.results, inputResult.parameterName);
      if (paramIndex !== -1) {
        const param = testItem.results[paramIndex];
        const val = inputResult.value;

        // Refresh referenceRange from master definition if available
        if (masterDef) {
          const masterParam = masterDef.parameters.find(
            p => p.name.trim().toLowerCase() === param.parameterName.trim().toLowerCase()
          );
          if (masterParam) {
            param.resultType = masterParam.resultType || 'NUMERIC';
            param.referenceRange = buildResultReferenceRange(masterParam, patient?.gender);
          }
        }

        // VALIDATION: Numeric range check (skip for QUALITATIVE)
        const rt = param.resultType || 'NUMERIC';
        if (rt !== 'QUALITATIVE') {
          const range = param.referenceRange;
          if (range && (range.min !== undefined || range.max !== undefined)) {
            const numValue = parseFloat(val);
            if (isNaN(numValue)) {
              throw new ApiError(400, `Result for ${param.parameterName} must be a number`);
            }
            if (range.max && numValue > range.max * 10) {
              throw new ApiError(400, `Value ${val} seems realistically high for ${param.parameterName}`);
            }
          }
        }

        param.value = val;
      }
    });
  }

  if (reportFileUrl) testItem.reportFileUrl = reportFileUrl;

  // Update Audit Info
  testItem.status = "COMPLETED";
  testItem.enteredBy = userId;
  testItem.enteredAt = new Date();

  const allCompleted = order.tests.every((t) => t.status === "COMPLETED");
  const anyCompleted = order.tests.some((t) => t.status === "COMPLETED");

  order.overallStatus = allCompleted
    ? "COMPLETED"
    : anyCompleted
      ? "PARTIAL"
      : "PENDING";

  await order.save();

  // Update patient's lastTestResultAt for sorting in Report Section
  await Patient.findByIdAndUpdate(order.patientId, {
    lastTestResultAt: new Date()
  });

  return order;
};


// 4. Get Pending Test Orders
export const getPendingOrders = async (labId) => {
  return await TestOrder.find({
    labId,
    overallStatus: { $in: ["PENDING", "PARTIAL"] },
  })
    .select("reportId patientId doctor tests orderDate overallStatus createdAt updatedAt billId")
    .populate("patientId", "fullName phone age gender")
    .populate("doctor", "name")
    .sort({ orderDate: -1 });
};

export const getPatientTestHistory = async (patientId, labId) => {
  const orders = await TestOrder.find({ patientId, labId })
    .select("reportId patientId doctor tests orderDate overallStatus isHistorical createdAt updatedAt isDownloaded isEmailed")
    .populate("patientId", "fullName phone age gender reportPdfPath")
    .populate("doctor", "name")
    .sort({ orderDate: -1 });

  const activeOrders = orders.filter((o) => o.overallStatus !== "COMPLETED");
  const completedReports = orders
    .filter((o) => o.overallStatus === "COMPLETED")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return { orders: activeOrders, reports: completedReports };
};

// 5. Get Patient Orders
export const getPatientOrders = async (patientId, labId) => {
  return await TestOrder.find({ patientId, labId })
    .select("reportId patientId doctor tests orderDate overallStatus createdAt updatedAt")
    .populate("patientId", "fullName phone age gender")
    .populate("doctor", "name")
    .sort({ orderDate: -1 });
};

// 5b. Get Patient Reports
export const getPatientReports = async (patientId, labId) => {
  return await TestOrder.find({
    patientId,
    labId,
    overallStatus: "COMPLETED",
  })
    .select("reportId patientId doctor tests orderDate overallStatus isHistorical createdAt updatedAt isDownloaded isEmailed")
    .populate("patientId", "fullName phone age gender reportPdfPath")
    .populate("doctor", "name")
    .sort({ updatedAt: -1 });
};

// 5c. Get All Completed Reports for a Lab
export const getAllReportsForLab = async (labId, limit = 12, search = "", page = 1) => {
  let query = {
    labId,
    overallStatus: "COMPLETED",
  };

  if (search) {
    const patients = await Patient.find({
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const patientIds = patients.map(p => p._id);
    query.patientId = { $in: patientIds };
  }

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    TestOrder.find(query)
      .populate("patientId", "fullName phone age gender reportPdfPath")
      .populate("doctor", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    TestOrder.countDocuments(query)
  ]);

  return {
    reports,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page)
  };
};

// 6. Bulk Submit Results by Bill
export const submitBulkResultsByBill = async (
  billId,
  { results, reportFileUrl, userId }
) => {
  const bill = await Bill.findById(billId);
  if (!bill) throw new ApiError(404, "Bill not found");

  const order = await TestOrder.findById(bill.testOrderId);
  if (!order) throw new ApiError(404, "Test Order not found for this bill");

  // Fetch master LabTest definitions to refresh referenceRange with displayText
  const testIds = [...new Set(order.tests.map(t => t.testId.toString()))];
  const labTests = await LabTest.find({ _id: { $in: testIds } });
  const labTestMap = {};
  labTests.forEach(lt => { labTestMap[lt._id.toString()] = lt; });

  // Fetch patient for gender-specific range selection
  let patient = null;
  try {
    patient = await Patient.findById(order.patientId);
  } catch (e) { /* ignore */ }

  let anyUpdated = false;

  order.tests.forEach((testItem) => {
    // Audit check: If already completed, skip unless we wanted to edit
    if (testItem.status === "COMPLETED") return;

    const masterDef = labTestMap[testItem.testId.toString()];

    let testModified = false;
    results?.forEach((inputResult) => {
      const paramIndex = findParameterIndex(testItem.results, inputResult.parameterName);
      if (paramIndex !== -1) {
        const param = testItem.results[paramIndex];
        const val = inputResult.value;

        // Refresh referenceRange from master definition if available
        if (masterDef) {
          const masterParam = masterDef.parameters.find(
            p => p.name.trim().toLowerCase() === param.parameterName.trim().toLowerCase()
          );
          if (masterParam) {
            param.resultType = masterParam.resultType || 'NUMERIC';
            param.referenceRange = buildResultReferenceRange(masterParam, patient?.gender);
          }
        }

        // Basic numeric validation if range exists and result type is numeric
        const rt = param.resultType || 'NUMERIC';
        if (rt !== 'QUALITATIVE' && param.referenceRange && val && val.trim() !== "") {
          const numValue = parseFloat(val);
          if (param.referenceRange.max && !isNaN(numValue) && numValue > param.referenceRange.max * 10) {
            throw new ApiError(400, `Value too high for ${param.parameterName}`);
          }
        }

        param.value = val;
        testModified = true;
      }
    });

    if (reportFileUrl) {
      testItem.reportFileUrl = reportFileUrl;
      testModified = true;
    }

    if (testModified) {
      const allFilled = testItem.results.every((r) => r.value && r.value.trim() !== "");
      if (allFilled) {
        testItem.status = "COMPLETED";

        testItem.enteredBy = userId;
        testItem.enteredAt = new Date();
      }
      anyUpdated = true;
    }
  });

  if (anyUpdated) {
    const allCompleted = order.tests.every((t) => t.status === "COMPLETED");
    const anyCompleted = order.tests.some((t) => t.status === "COMPLETED");
    order.overallStatus = allCompleted ? "COMPLETED" : anyCompleted ? "PARTIAL" : "PENDING";
    await order.save();

    // Update patient's lastTestResultAt for sorting in Report Section
    await Patient.findByIdAndUpdate(order.patientId, {
      lastTestResultAt: new Date()
    });
  }

  return order;
};

// 7. Reopen Test Result (Unlock for editing)
export const reopenTestResult = async (orderId, testItemId) => {
  const order = await TestOrder.findById(orderId);
  if (!order) throw new ApiError(404, "Test Order not found");

  const testItem = order.tests.id(testItemId);
  if (!testItem) throw new ApiError(404, "Test not found");

  testItem.status = "PENDING";
  order.overallStatus = "PARTIAL"; // Ensure it's not COMPLETED anymore

  await order.save();
  return order;
};



// 9. Finalize Test Order
export const finalizeTestOrder = async (orderId) => {
  const order = await TestOrder.findById(orderId);
  if (!order) throw new ApiError(404, "Test Order not found");

  const allCompleted = order.tests.every((test) => test.status === "COMPLETED");
  if (!allCompleted) {
    throw new ApiError(400, "Cannot finalize - not all tests completed");
  }

  order.overallStatus = "COMPLETED";
  await order.save();
  return order;
};

// 10. Get Test Order by ID with full details
export const getTestOrderById = async (orderId) => {
  return await TestOrder.findById(orderId)
    .populate("patientId")
    .populate("doctor", "name")
    .populate("labId")
    .populate({
      path: "tests.testId",
      select: "category testName parameters specialization",
      populate: { path: "departmentId", select: "name" }
    });
};
// 11. Delete Test Order
export const deleteTestOrder = async (orderId, labId) => {
  const order = await TestOrder.findOne({ _id: orderId, labId });
  if (!order) {
    throw new ApiError(404, "Test Order not found");
  }

  // Delete associated bill if exists
  if (order.billId) {
    await Bill.findByIdAndDelete(order.billId);
  }

  // Delete the order itself
  await TestOrder.findByIdAndDelete(orderId);

  return { message: "Order and associated bill deleted successfully" };
};

// 12. Mark Order as Downloaded
export const markAsDownloaded = async (orderId) => {
  return await TestOrder.findByIdAndUpdate(orderId, { isDownloaded: true }, { new: true });
};

// 13. Get Daily Stats
export const getDailyStats = async (labId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const stats = await TestOrder.aggregate([
    {
      $match: {
        labId: new mongoose.Types.ObjectId(labId),
        orderDate: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $project: {
        testCount: { $size: "$tests" },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalTests: { $sum: "$testCount" },
      },
    },
  ]);

  return stats[0] || { totalOrders: 0, totalTests: 0 };
};

// 10. Unfinalize Report (Option 1 for Correction)
export const unfinalizeReport = async (orderId, labId) => {
  const order = await TestOrder.findOne({ _id: orderId, labId });
  if (!order) throw new ApiError(404, "Report not found");

  if (order.overallStatus !== "COMPLETED") {
    throw new ApiError(400, "Only fully completed reports can be unfinalized");
  }

  // 1. Reset Order Status to PARTIAL (not PENDING)
  // This ensures it shows in Pending Orders, but tests remain COMPLETED
  // so the Edit button appears for each test
  order.overallStatus = "PARTIAL";

  // 2. Clear Patient PDF path (since it's now invalid)
  await Patient.findByIdAndUpdate(order.patientId, {
    reportPdfPath: null,
    reportStatus: "pending"
  });

  await order.save();
  return order;
};
