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

// 1. Create Test Order
export const createTestOrder = async ({
  patientId,
  testIds,
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

  // Fetch all LabTests in one go (Batching Optimization)
  const labTests = await LabTest.find({ _id: { $in: testIds } });
  if (labTests.length !== testIds.length) {
    throw new ApiError(404, "One or more tests not found");
  }

  const tests = [];
  let totalAmount = 0;

  for (const labTest of labTests) {
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
    });

    totalAmount += (labTest.price || 0);
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

  try {
    const [testOrder] = await TestOrder.create(
      [
        {
          patientId,
          labId,
          doctor: doctorId,
          tests,
          totalAmount: finalBillAmount,
          discountId: discountId || null,
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
        items: tests.map((t) => ({ name: t.testName, price: t.price })),
        totalAmount: finalBillAmount, // Bill stores the POST-DISCOUNT amount
        discountId: discountId || null,
        discountAmount,
        labId,
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

  const report = await TestOrder.create({
    patientId,
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

  // SAFETY LOCK: Prevent silent edits on completed tests
  if (testItem.status === "COMPLETED") {
    throw new ApiError(403, "Completed tests are locked. Reopen to edit.");
  }

  if (results && Array.isArray(results)) {
    results.forEach((inputResult) => {
      const paramIndex = findParameterIndex(testItem.results, inputResult.parameterName);
      if (paramIndex !== -1) {
        const param = testItem.results[paramIndex];
        const val = inputResult.value;

        // VALDIATION: Numeric and Range check
        const range = param.referenceRange;
        if (range && (range.min !== undefined || range.max !== undefined)) {
          const numValue = parseFloat(val);
          if (isNaN(numValue)) {
            throw new ApiError(400, `Result for ${param.parameterName} must be a number`);
          }
          // Prevent extreme outliers (e.g., 999 when range is 12-18)
          // Simple rule: block if value is 10x outside the range or just unrealistic
          if (range.max && numValue > range.max * 10) {
            throw new ApiError(400, `Value ${val} seems realistically high for ${param.parameterName}`);
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
  return order;
};

// 4. Get Pending Test Orders
export const getPendingOrders = async (labId) => {
  return await TestOrder.find({
    labId,
    overallStatus: { $in: ["PENDING", "PARTIAL"] },
  })
    .populate("patientId", "fullName phone age gender")
    .populate("doctor", "name")
    .sort({ orderDate: -1 });
};

export const getPatientTestHistory = async (patientId, labId) => {
  const orders = await TestOrder.find({ patientId, labId })
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
    .populate("patientId", "fullName phone age gender reportPdfPath")
    .populate("doctor", "name")
    .sort({ updatedAt: -1 });
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

  let anyUpdated = false;

  order.tests.forEach((testItem) => {
    // Audit check: If already completed, skip unless we wanted to edit
    // (For bulk, we usually skip already completed tests to avoid accidental overwrites)
    if (testItem.status === "COMPLETED") return;

    let testModified = false;
    results?.forEach((inputResult) => {
      const paramIndex = findParameterIndex(testItem.results, inputResult.parameterName);
      if (paramIndex !== -1) {
        const param = testItem.results[paramIndex];
        const val = inputResult.value;

        // Basic numeric validation if range exists
        if (param.referenceRange && val && val.trim() !== "") {
          const numValue = parseFloat(val);
          if (isNaN(numValue)) throw new ApiError(400, `Invalid numeric value for ${param.parameterName}`);
          if (param.referenceRange.max && numValue > param.referenceRange.max * 10) {
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

      // Fetch patient to get gender for reference range selection
      const patient = await Patient.findById(order.patientId).session(session);

      for (const labTest of labTests) {
        // Prevent adding duplicate of the EXACT same test inside the same order
        if (order.tests.some(t => t.testId.toString() === labTest._id.toString())) continue;

        const initialResults = labTest.parameters.map(p => ({
          parameterName: p.name,
          value: "",
          unit: p.unit,
          referenceRange: selectReferenceRange(p.referenceRanges, patient?.gender)
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
    // Maintain existing discount (flat amount) logic for now
    // Ideally we should recalculate percentage discounts, but for now we trust the stored amount
    const netTotal = Math.max(0, grossTotal - (order.discountAmount || 0));

    order.totalAmount = Math.round(netTotal);

    // 4. Update Bill
    bill.items = order.tests.map(t => ({ name: t.testName, price: t.price }));
    bill.totalAmount = Math.round(netTotal);

    // 5. Update Status
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
      select: "category testName parameters",
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
