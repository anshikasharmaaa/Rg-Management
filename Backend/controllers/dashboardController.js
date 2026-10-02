import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";
import Category from "../models/Category.js";
import Employee from "../models/Employee.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import BranchTransfer from "../models/BranchTransfer.js";
import { BRANCHES, BRANCH_LABELS } from "../utils/branchConstants.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { computeOrderStats } from "../utils/orderStats.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const orderStats = await computeOrderStats();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      availableTables,
      occupiedTables,
      totalMenuItems,
      activeMenuItems,
      totalCategories,
      activeCategories,
      totalEmployees,
      activeEmployees,
      todaySalesAgg,
      todaySlotAgg,
      todayBranchAgg,
      transfersAgg,
    ] = await Promise.all([
      Table.countDocuments({ status: "AVAILABLE" }),
      Table.countDocuments({ status: "OCCUPIED" }),
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ isActive: true, isAvailable: true }),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Employee.countDocuments(),
      Employee.countDocuments({ status: "ACTIVE" }),
      Payment.aggregate([
        { $match: { date: { $gte: startOfToday, $lte: endOfToday } } },
        {
          $group: {
            _id: null,
            totalSale: { $sum: "$totalSale" },
            online: { $sum: "$online" },
            cash: { $sum: "$cash" },
          },
        },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: startOfToday, $lte: endOfToday } } },
        { $group: { _id: "$slot", totalSale: { $sum: "$totalSale" } } },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: startOfToday, $lte: endOfToday } } },
        {
          $group: {
            _id: "$branch",
            totalSale: { $sum: "$totalSale" },
            online: { $sum: "$online" },
            cash: { $sum: "$cash" },
          },
        },
      ]),
      BranchTransfer.aggregate([
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const todayTotalSales = todaySalesAgg[0]?.totalSale || 0;
    const todayOnlineSales = todaySalesAgg[0]?.online || 0;
    const todayCashSales = todaySalesAgg[0]?.cash || 0;

    const todayMorningSales =
      todaySlotAgg.find((s) => s._id === "MORNING")?.totalSale || 0;
    const todayEveningSales =
      todaySlotAgg.find((s) => s._id === "EVENING")?.totalSale || 0;

    const branchSales = BRANCHES.map((branchKey) => {
      const found = todayBranchAgg.find((b) => b._id === branchKey);
      return {
        branch: branchKey,
        label: BRANCH_LABELS[branchKey],
        totalSale: found?.totalSale || 0,
        online: found?.online || 0,
        cash: found?.cash || 0,
      };
    });

    return sendSuccess(res, 200, "Dashboard overview fetched successfully", {
      ...orderStats,
      availableTables,
      occupiedTables,
      totalMenuItems,
      activeMenuItems,
      totalCategories,
      activeCategories,
      totalEmployees,
      activeEmployees,
      todayTotalSales,
      todayOnlineSales,
      todayCashSales,
      todayMorningSales,
      todayEveningSales,
      branchSales,
      totalTransfersAmount: transfersAgg[0]?.amount || 0,
      totalTransfersCount: transfersAgg[0]?.count || 0,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching dashboard overview",
    );
  }
};

export const getDashboardCharts = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      ordersOverTime,
      statusDistribution,
      paymentMethodDistribution,
      popularItems,
      employeeWorkload,
      salesTrend,
      branchComparison,
      slotComparison,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" } },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { assignedEmployee: { $ne: null } } },
        { $group: { _id: "$assignedEmployee", orders: { $sum: 1 } } },
        {
          $lookup: {
            from: "employees",
            localField: "_id",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        {
          $project: {
            _id: 0,
            employeeId: "$_id",
            name: "$employee.name",
            orders: 1,
          },
        },
        { $sort: { orders: -1 } },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalSale: { $sum: "$totalSale" },
            online: { $sum: "$online" },
            cash: { $sum: "$cash" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$branch", totalSale: { $sum: "$totalSale" } } },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$slot", totalSale: { $sum: "$totalSale" } } },
      ]),
    ]);

    const branchComparisonLabeled = BRANCHES.map((branchKey) => ({
      branch: branchKey,
      label: BRANCH_LABELS[branchKey],
      totalSale:
        branchComparison.find((b) => b._id === branchKey)?.totalSale || 0,
    }));

    return sendSuccess(res, 200, "Dashboard charts fetched successfully", {
      ordersOverTime,
      statusDistribution,
      paymentMethodDistribution,
      popularItems,
      employeeWorkload,
      salesTrend,
      branchComparison: branchComparisonLabeled,
      slotComparison,
    });
  } catch (error) {
    console.error("Dashboard charts error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching dashboard charts",
    );
  }
};
