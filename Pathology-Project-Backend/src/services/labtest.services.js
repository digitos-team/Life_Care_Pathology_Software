// src/services/test/test.service.js
import Test from "../models/labtest.model.js";
import { ApiError } from "../utils/ApiError.js";

class TestService {
  async createTest(data) {
    const existingTest = await Test.findOne({
      testName: data.testName,
      labId: data.labId,
      isActive: true,
    });

    if (existingTest) {
      throw new ApiError(409, "Test already exists");
    }

    return await Test.create(data);
  }

  async getAllTests(labId) {
    return await Test.find({ labId, isActive: true });
  }

  async getTestById(testId, labId) {
    return await Test.findOne({
      _id: testId,
      labId,
      isActive: true,
    });
  }

  async updateTest(testId, data, labId) {
    const updatedTest = await Test.findOneAndUpdate(
      { _id: testId, labId, isActive: true },
      data,
      { new: true }
    );

    if (!updatedTest) {
      throw new ApiError(404, "Test not found");
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
}

export default new TestService();
