import Doctor from "../models/doctor.model.js";
import PathologyLab from "../models/pathologyLab.model.js";
import Expense from "../models/expense.model.js";
import DoctorSpecialization from "../models/doctorSpecialization.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// Helper to assign specializations
const assignSpecializations = async (doctorId, specializationIds) => {
  if (!specializationIds || !Array.isArray(specializationIds)) return;

  // Clear existing specializations
  await DoctorSpecialization.deleteMany({ doctorId });

  // Add new specializations
  if (specializationIds.length > 0) {
    const specs = specializationIds.map((specId) => ({
      doctorId,
      specializationId: specId,
    }));
    await DoctorSpecialization.insertMany(specs);
  }
};

export const createDoctorService = async (doctorData, labId) => {
  const { specializationIds, ...data } = doctorData;

  const doctor = await Doctor.create({
    ...data,
    lab: labId,
  });

  // Assign specializations if provided
  if (specializationIds && specializationIds.length > 0) {
    await assignSpecializations(doctor._id, specializationIds);
  }

  // Return full doctor with specializations
  return await getDoctorByIdService(doctor._id, labId);
};

export const updateDoctorService = async (doctorId, updates) => {
  const { specializationIds, ...data } = updates;
  const doctor = await Doctor.findByIdAndUpdate(doctorId, data, {
    new: true,
  });
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  // Update specializations if provided
  if (specializationIds) {
    await assignSpecializations(doctor._id, specializationIds);
  }

  // Return full doctor with specializations
  return await getDoctorByIdService(doctor._id, doctor.lab);
};

export const assignSpecializationsToDoctorService = async (
  doctorId,
  specializationIds
) => {
  await assignSpecializations(doctorId, specializationIds);
  return await DoctorSpecialization.find({ doctorId }).populate(
    "specializationId"
  );
};

export const removeSpecializationsFromDoctorService = async (
  doctorId,
  specializationIds
) => {
  await DoctorSpecialization.deleteMany({
    doctorId,
    specializationId: { $in: specializationIds },
  });
};


export const getAllDoctorsService = async (labId, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;

  const [doctors, totalCount] = await Promise.all([
    Doctor.find({ lab: labId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Doctor.countDocuments({ lab: labId }),
  ]);

  // Fetch specializations for all doctors in this page
  const doctorIds = doctors.map(d => d._id);
  const allSpecs = await DoctorSpecialization.find({ doctorId: { $in: doctorIds } })
    .populate("specializationId")
    .lean();

  // Group specs by doctorId
  const specsByDoctor = allSpecs.reduce((acc, spec) => {
    const dId = spec.doctorId.toString();
    if (!acc[dId]) acc[dId] = [];
    acc[dId].push(spec.specializationId);
    return acc;
  }, {});

  // Attach specs to doctors
  const doctorsWithSpecs = doctors.map(d => ({
    ...d,
    specializations: specsByDoctor[d._id.toString()] || []
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return {
    doctors: doctorsWithSpecs,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: totalCount,
      recordsPerPage: limit,
      total: totalCount // added for frontend compatibility
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
          testNames: {
            $map: {
              input: "$billDetails.items",
              as: "item",
              in: "$$item.name",
            },
          },
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
  const query = { _id: doctorId };
  if (labId) query.lab = labId;

  const doctor = await Doctor.findOne(query).lean();
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  const specializations = await DoctorSpecialization.find({ doctorId })
    .populate("specializationId")
    .lean();

  return {
    ...doctor,
    specializations: specializations.map((s) => s.specializationId),
  };
};