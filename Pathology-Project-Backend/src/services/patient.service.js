import Patient from "../models/patient.model.js";
import mongoose from "mongoose";
import PathologyLab from "../models/pathologyLab.model.js";

// Helper to get Lab ID
const getLabIdByOwner = async (userId) => {
  console.log("[SERVICE] getLabIdByOwner called", { userId });
  const lab = await PathologyLab.findOne({ owner: userId });
  if (!lab) {
    throw new Error("No Lab found for this Admin. Please create a Lab first.");
  }
  return lab._id;
};


// Helper to generate Patient ID
const generatePatientId = async () => {
  // Use aggregation to compute numeric part and get max without scanning all documents into app memory
  const res = await Patient.aggregate([
    { $match: { patientId: { $exists: true, $ne: "" } } },
    {
      $project: {
        codeStr: "$patientId",
        // Remove PAT prefix if present, else keep original
        numericPart: {
          $toInt: {
            $cond: [
              {
                $regexMatch: { input: "$patientId", regex: /^PAT(\d+)$/ },
              },
              {
                $replaceOne: {
                  input: "$patientId",
                  find: "PAT",
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

  const maxNumber = res[0]?.maxNum || 100; // default baseline
  const nextNumber = maxNumber + 1;
  const formatted = String(nextNumber).padStart(3, "0");
  return `PAT${formatted}`;
};


export const createPatient = async (data, userId, labIdFromController) => {
  console.log("[SERVICE] createPatient called", { data, userId });

  const labId = labIdFromController || (await getLabIdByOwner(userId));

  // Auto-generate patientId if not provided
  const patientId = await generatePatientId();

  // Handle address if it's a string from frontend
  const addressPayload =
    typeof data.address === "string" ? { street: data.address } : data.address;

  try {
    const patient = await Patient.create({
      ...data,
      patientId, // Use generated ID
      address: addressPayload,
      createdBy: userId,
      labId,
    });
    return patient;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(
        "Patient already exists with same details in this lab"
      );
    }
    throw error;
  }
};

//added Pagination for patients
export const getPatientsByLab = async (labId, options = {}) => {
  // Get pagination parameters with defaults
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;

  // Get search and filter parameters
  const search = options.search || "";
  const gender = options.gender || "";
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder === "asc" ? 1 : -1;
  const ageMin = options.ageMin || "";
  const ageMax = options.ageMax || "";

  // Get labId

  // Build query filter
  const filter = { labId, isActive: true };

  // Add search functionality (name, phone, or patientId)
  // Use combination of exact match for patientId and text search for name/phone
  if (search && search.trim() !== "") {
    const searchTerm = search.trim();

    // Search using $or: exact match for patientId OR text search for name/phone
    filter.$or = [
      { patientId: { $regex: searchTerm, $options: "i" } }, // Case-insensitive match for patientId
      { phone: { $regex: searchTerm, $options: "i" } }, // Phone search
      { fullName: { $regex: searchTerm, $options: "i" } } // Name search
    ];
  }

  // Filter by gender
  if (gender && gender !== "") {
    filter.gender = gender;
  }

  // Filter by age range
  if (ageMin !== "" || ageMax !== "") {
    filter.age = {};
    if (ageMin !== "") filter.age.$gte = parseInt(ageMin);
    if (ageMax !== "") filter.age.$lte = parseInt(ageMax);
  }

  // Filter by date range (createdAt)
  if (options.startDate || options.endDate) {
    filter.createdAt = {};
    if (options.startDate) filter.createdAt.$gte = new Date(options.startDate);
    if (options.endDate) filter.createdAt.$lte = new Date(options.endDate);
  }

  // Build sort object
  const sort = { [sortBy]: sortOrder };

  // Execute queries in parallel for better performance
  const [patients, totalCount] = await Promise.all([
    Patient.find(filter)
      .select("patientId fullName phone age gender address reportStatus createdAt updatedAt lastTestResultAt")
      .populate("createdBy", "name email") // If you want to populate createdBy
      .sort(sort)
      .skip(skip)
      .limit(limit)

      .lean(), // Use lean() for better performance
    Patient.countDocuments(filter),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    patients,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: totalCount,
      recordsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  };
};

export const getPatientById = async (patientId, labId) => {
  return await Patient.findOne({ _id: patientId, labId }).populate(
    "testHistory"
  );
};

export const updatePatient = async (patientId, labId, updateData) => {
  return await Patient.findOneAndUpdate({ _id: patientId, labId }, updateData, {
    new: true,
  });
};

export const deletePatient = async (patientId, labId) => {
  return await Patient.findOneAndDelete({ _id: patientId, labId });
};

export const searchPatient = async (labId, query) => {
  const filter = { labId, isActive: true };

  // Use exact match for phone (indexed field)
  if (query.phone) filter.phone = query.phone;

  // Use $text search for fullName (utilizes text index, fast & secure)
  if (query.fullName) {
    filter.$text = { $search: query.fullName };
  }

  return await Patient.find(filter);
};

export const getTodayPatients = async (labId) => {
  const labObjectId = new mongoose.Types.ObjectId(labId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  return Patient.find({
    labId: labObjectId,
    isActive: true,
    createdAt: { $gte: startOfDay, $lt: startOfNextDay },
  }).sort({ createdAt: -1 });
};

// get total patient count
export const getTotalPatientCount = async (labId) => {
  const labObjectId = new mongoose.Types.ObjectId(labId);
  return await Patient.countDocuments({
    labId: labObjectId,
    isActive: true,
  });
};


//get daily patient
export const dailypatient = async (labId, year, month) => {
  const labObjectId = new mongoose.Types.ObjectId(labId);

  const startDate = new Date(year, month - 1, 1);
  const nextMonthStart = new Date(year, month, 1);

  const dailyData = await Patient.aggregate([
    {
      $match: {
        labId: labObjectId,
        createdAt: { $gte: startDate, $lt: nextMonthStart },
      },
    },
    {
      $group: {
        _id: { day: { $dayOfMonth: "$createdAt" } },
        totalPatients: { $sum: 1 },
      },
    },
    { $sort: { "_id.day": 1 } },
  ]);

  return dailyData;
};
