import Revenue from "../models/revenue.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// Record revenue after payment
export const recordRevenue = async ({ billId, totalAmount, commissionAmount, labId }) => {
    const netRevenue = totalAmount - commissionAmount;

    const revenue = await Revenue.create({
        billId,
        totalAmount,
        commissionAmount,
        netRevenue,
        labId: new mongoose.Types.ObjectId(labId),
    });

    return revenue;
};

// Get revenue stats
export const getRevenueWithPaginationService = async (labId, query) => {
    const labObjectId = new mongoose.Types.ObjectId(labId);

    const filter = { labId: labObjectId };

    // Date filter
    if (query.startDate && query.endDate) {
        filter.createdAt = {
            $gte: new Date(new Date(query.startDate).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(query.endDate).setHours(23, 59, 59, 999)),
        };
    }

    // 🔹 Pagination
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 🔹 Stats (Aggregation)
    const statsAgg = await Revenue.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalCommission: { $sum: "$commissionAmount" },
                netRevenue: { $sum: "$netRevenue" },
                count: { $sum: 1 },
            },
        },
        {
            $addFields: {
                totalRevenue: { $round: ["$totalRevenue", 2] },
                totalCommission: { $round: ["$totalCommission", 2] },
                netRevenue: { $round: ["$netRevenue", 2] },
            },
        },
    ]);

    const stats = statsAgg[0] || {
        totalRevenue: 0,
        totalCommission: 0,
        netRevenue: 0,
        count: 0,
    };

    // 🔹 Count for pagination
    const totalRecords = await Revenue.countDocuments(filter);

    // 🔹 Paginated list
    const revenues = await Revenue.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: "billId",
            populate: [
                { path: "patientId", select: "fullName phone age gender" },
                { path: "testOrderId", populate: { path: "doctor", select: "name" } }
            ]
        });

    return {
        stats,
        data: revenues,
        pagination: {
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
            limit,
        },
    };
};

// Helper to normalize monthly data
const normalizeMonths = (data) => {
    const map = {};
    data.forEach(m => map[m._id] = m);

    return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        totalRevenue: map[i + 1]?.totalRevenue || 0,
        netRevenue: map[i + 1]?.netRevenue || 0,
        count: map[i + 1]?.count || 0,
    }));
};

// Helper to normalize daily data
const normalizeDays = (year, month, data) => {
    // If month is not provided, return empty array
    if (!month) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const map = {};
    data.forEach(d => map[d._id] = d);

    return Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        totalRevenue: map[i + 1]?.totalRevenue || 0,
        netRevenue: map[i + 1]?.netRevenue || 0,
        count: map[i + 1]?.count || 0,
    }));
};

export const getRevenueAnalytics = async ({
    labId,
    year,
    month // optional (1–12)
}) => {
    const labObjectId = new mongoose.Types.ObjectId(labId);

    const yearStart = new Date(year, 0, 1);
    const nextYearStart = new Date(year + 1, 0, 1);

    let monthStart, nextMonthStart;
    if (month) {
        monthStart = new Date(year, month - 1, 1);
        nextMonthStart = new Date(year, month, 1);
    }

    const pipeline = [
        {
            $match: {
                labId: labObjectId,
                createdAt: { $gte: yearStart, $lt: nextYearStart },
            },
        },
        {
            $facet: {
                yearlyTotal: [
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$totalAmount" },
                            totalCommission: { $sum: "$commissionAmount" },
                            netRevenue: { $sum: "$netRevenue" },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $addFields: {
                            totalRevenue: { $round: ["$totalRevenue", 2] },
                            totalCommission: { $round: ["$totalCommission", 2] },
                            netRevenue: { $round: ["$netRevenue", 2] },
                        },
                    },
                ],

                monthly: [
                    {
                        $group: {
                            _id: { $month: "$createdAt" },
                            totalRevenue: { $sum: "$totalAmount" },
                            netRevenue: { $sum: "$netRevenue" },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $addFields: {
                            totalRevenue: { $round: ["$totalRevenue", 2] },
                            netRevenue: { $round: ["$netRevenue", 2] },
                        },
                    },
                    { $sort: { _id: 1 } },
                ],

                daily: month
                    ? [
                        {
                            $match: {
                                createdAt: { $gte: monthStart, $lt: nextMonthStart },
                            },
                        },
                        {
                            $group: {
                                _id: { $dayOfMonth: "$createdAt" },
                                totalRevenue: { $sum: "$totalAmount" },
                                netRevenue: { $sum: "$netRevenue" },
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $addFields: {
                                totalRevenue: { $round: ["$totalRevenue", 2] },
                                netRevenue: { $round: ["$netRevenue", 2] },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ]
                    : [],
            },
        },
    ];

    const [result] = await Revenue.aggregate(pipeline);

    return {
        yearlyTotal: result?.yearlyTotal[0] || {},
        monthly: normalizeMonths(result?.monthly || []),
        daily: month ? normalizeDays(year, month, result?.daily || []) : [],
    };
};

export const deleteRevenueById = async (revenueId, labId) => {
    const revenue = await Revenue.findOneAndDelete({ _id: revenueId, labId });
    if (!revenue) {
        throw new ApiError(404, "Revenue record not found or unauthorized");
    }
    return revenue;
};
