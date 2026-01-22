import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as revenueService from "../services/revenue.service.js";

// Get revenue stats
export const getRevenueStatsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const query = req.query;

  const result = await revenueService.getRevenueWithPaginationService(
    labId,
    query
  );

  res.status(200).json(
    new ApiResponse(200, result, "Revenue fetched successfully")
  );
});

// Get unified revenue analytics
export const getRevenueAnalyticsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const { year, month } = req.query;

  if (!year) {
    return res.status(400).json(new ApiResponse(400, null, "Year is required"));
  }

  const analyticsData = await revenueService.getRevenueAnalytics({
    labId,
    year: Number(year),
    month: month ? Number(month) : undefined
  });

  res.status(200).json(new ApiResponse(200, analyticsData, "Revenue analytics fetched successfully"));
});

// Delete Revenue record
export const deleteRevenueController = asyncHandler(async (req, res) => {
  const { revenueId } = req.params;
  const labId = req.user.labId;

  await revenueService.deleteRevenueById(revenueId, labId);

  res.status(200).json(new ApiResponse(200, null, "Revenue record deleted successfully"));
});
