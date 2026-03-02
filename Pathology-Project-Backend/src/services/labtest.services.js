// src/services/test/test.service.js
import mongoose from "mongoose";
import Test from "../models/labtest.model.js";
import TestSpecialization from "../models/testSpecialization.model.js";
import Department from "../models/department.model.js";
import { ApiError } from "../utils/ApiError.js";

class TestService {
  async assignSpecializations(testId, specializationIds) {
    if (!specializationIds || !Array.isArray(specializationIds)) return;

    // Clear existing specializations
    await TestSpecialization.deleteMany({ testId });

    // Add new specializations
    if (specializationIds.length > 0) {
      const specs = specializationIds.map((specId) => ({
        testId,
        specializationId: specId,
      }));
      await TestSpecialization.insertMany(specs);
    }
  }

  async createTest(data) {
    const { specializationIds, ...testData } = data;

    const existingTest = await Test.findOne({
      testName: testData.testName,
      labId: testData.labId,
      isActive: true,
    });

    if (existingTest) {
      throw new ApiError(409, "Test already exists");
    }

    const test = await Test.create(testData);

    // Assign specializations if provided
    if (specializationIds && specializationIds.length > 0) {
      await this.assignSpecializations(test._id, specializationIds);
    }

    return test;
  }

  async getAllTests(labId, filters = {}, page = 1, limit = 10) {

    // Support limit='all' to fetch every test (used by Test Package form)
    const fetchAll = limit === 'all';
    if (!fetchAll) {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      limit = limit > 10 ? 10 : limit;
    }
    const skip = fetchAll ? 0 : (page - 1) * limit;
    const { departmentId, search } = filters;

    // Build the query
    const query = { labId, isActive: true };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (search) {
      query.testName = { $regex: search, $options: "i" };
    }

    const totalRecords = await Test.countDocuments(query);
    let testsQuery = Test.find(query)
      .populate("departmentId", "name")
      .sort({ testName: 1 });

    if (!fetchAll) {
      testsQuery = testsQuery.skip(skip).limit(limit);
    }

    const tests = await testsQuery.lean();


    // Fetch all specializations for these tests
    const testIds = tests.map(t => t._id);
    const allSpecs = await TestSpecialization.find({ testId: { $in: testIds } })
      .populate("specializationId")
      .lean();

    // Group by testId
    const specsByTest = allSpecs.reduce((acc, spec) => {
      const tId = spec.testId.toString();
      if (!acc[tId]) acc[tId] = [];
      acc[tId].push(spec.specializationId);
      return acc;
    }, {});

    // Attach to tests
    const data = tests.map(t => ({
      ...t,
      specializations: specsByTest[t._id.toString()] || []
    }));

    const totalPages = fetchAll ? 1 : Math.ceil(totalRecords / limit);

    return {
      data,
      totalRecords,
      page: fetchAll ? 1 : page,
      limit: fetchAll ? totalRecords : limit,
      totalPages,
      hasNextPage: fetchAll ? false : page < totalPages,
      hasPrevPage: fetchAll ? false : page > 1,
    }
  }

  /**
   * Get all tests grouped by department using MongoDB aggregation.
   * Returns: [{ department: { _id, name }, testCount: N, tests: [...] }]
   */
  async getTestsGroupedByDepartment(labId) {
    const labObjectId = new mongoose.Types.ObjectId(labId);

    const grouped = await Test.aggregate([
      // Match active tests for this lab
      { $match: { labId: labObjectId, isActive: true } },
      // Sort tests by name
      { $sort: { testName: 1 } },
      // Lookup the department details
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      // Unwind department (each test has exactly one department)
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      // Group by department
      {
        $group: {
          _id: "$departmentId",
          department: { $first: "$department" },
          testCount: { $sum: 1 },
          tests: {
            $push: {
              _id: "$_id",
              testName: "$testName",
              price: "$price",
              category: "$category",
              parameters: "$parameters",
              isActive: "$isActive",
            },
          },
        },
      },
      // Sort departments alphabetically
      { $sort: { "department.name": 1 } },
      // Clean up the output
      {
        $project: {
          _id: 0,
          department: {
            _id: "$department._id",
            name: "$department.name",
          },
          testCount: 1,
          tests: 1,
        },
      },
    ]);

    return grouped;
  }

  async getTestById(testId, labId) {
    return await Test.findOne({
      _id: testId,
      labId,
      isActive: true,
    }).populate("departmentId", "name");
  }

  async updateTest(testId, data, labId) {
    const { specializationIds, ...testData } = data;

    const updatedTest = await Test.findOneAndUpdate(
      { _id: testId, labId, isActive: true },
      testData,
      { new: true }
    );

    if (!updatedTest) {
      throw new ApiError(404, "Test not found");
    }

    // Update specializations if provided
    if (specializationIds) {
      await this.assignSpecializations(testId, specializationIds);
    }

    return updatedTest;
  }

  async deleteTest(testId, labId) {
    const deletedTest = await Test.findOneAndDelete({
      _id: testId,
      labId,
    });

    if (!deletedTest) {
      throw new ApiError(404, "Test not found");
    }

    return deletedTest;
  }

  async getTestWithSpecializations(testId, labId) {
    const test = await this.getTestById(testId, labId);
    if (!test) throw new ApiError(404, "Test not found");

    const specializations = await TestSpecialization.find({ testId })
      .populate("specializationId")
      .lean();

    return {
      ...test.toObject(),
      specializations: specializations.map((s) => s.specializationId),
    };
  }
}

export default new TestService();
