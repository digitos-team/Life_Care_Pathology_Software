// src/services/test/test.service.js
import Test from "../models/labtest.model.js";
import TestSpecialization from "../models/testSpecialization.model.js";
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

  async getAllTests(labId) {
    const tests = await Test.find({ labId, isActive: true }).lean();

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
    return tests.map(t => ({
      ...t,
      specializations: specsByTest[t._id.toString()] || []
    }));
  }

  async getTestById(testId, labId) {
    return await Test.findOne({
      _id: testId,
      labId,
      isActive: true,
    });
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
