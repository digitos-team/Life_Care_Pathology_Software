import Doctor from "../models/doctor.model.js";
import PathologyLab from "../models/pathologyLab.model.js";
import Expense from "../models/expense.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

export const createDoctorService = async (doctorData, labId) => {
  // We already have labId from the controller

  const doctor = await Doctor.create({
    ...doctorData,
    lab: labId,
  });

  return doctor;
};

export const updateDoctorService = async (doctorId, updates) => {
  const doctor = await Doctor.findByIdAndUpdate(doctorId, updates, {
    new: true,
  });
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }
  return doctor;
};

export const getAllDoctorsService = async (labId, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;

  const [doctors, totalCount] = await Promise.all([
    Doctor.find({ lab: labId }).skip(skip).limit(limit).lean(),
    Doctor.countDocuments({ lab: labId }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    doctors,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: totalCount,
      recordsPerPage: limit,
    },
  };
};

export const getDoctorCommissionReportService = async (doctorId, type) => {
  if (!doctorId) throw new ApiError(400, "Doctor ID is required");

  let groupId;

  if (type === "daily") {
    groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
  } else if (type === "monthly") {
    groupId = { $dateToString: { format: "%Y-%m", date: "$date" } };
  } else if (type === "yearly") {
    groupId = { $dateToString: { format: "%Y", date: "$date" } };
  } else if (type === "all") {
    groupId = null; // 👈 key point
  } else {
    throw new ApiError(400, "Invalid report type");
  }


  const pipeline = [
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(doctorId),
        category: "COMMISSION",
      },
    },
    {
      $lookup: {
        from: "bills",
        localField: "bill",
        foreignField: "_id",
        as: "billDetails",
      },
    },
    {
      $unwind: {
        path: "$billDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "billDetails.patientId",
        foreignField: "_id",
        as: "patientDetails",
      },
    },
    {
      $unwind: {
        path: "$patientDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  // GROUPING
  pipeline.push({
    $group: {
      _id: groupId, // null => all-time
      totalCommission: { $sum: "$amount" },
      count: { $sum: 1 },
      commissions: {
        $push: {
          amount: "$amount",
          date: "$date",
          patientName: "$patientDetails.fullName",
          billNumber: "$billDetails.billNumber",
        },
      },
    },
  });

  // SORT ONLY WHEN TIME-BASED
  if (groupId !== null) {
    pipeline.push({ $sort: { _id: -1 } });
  }

  const report = await Expense.aggregate(pipeline);

  // CLEAN RESPONSE FOR ALL-TIME
  if (type === "all") {
    return {
      totalCommission: report[0]?.totalCommission || 0,
      count: report[0]?.count || 0,
    };
  }

  return report;
};

export const deleteDoctorService = async (doctorId) => {
  const doctor = await Doctor.findByIdAndDelete(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }
  return doctor;
};
export const getDoctorByIdService = async (doctorId, labId) => {
  const doctor = await Doctor.findOne({ _id: doctorId, lab: labId }).lean();
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }
  return doctor;
};