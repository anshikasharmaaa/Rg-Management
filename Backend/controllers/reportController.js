import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import BranchTransfer from "../models/BranchTransfer.js";
import Table from "../models/Table.js";
import Employee from "../models/Employee.js";
import { BRANCHES, BRANCH_LABELS } from "../utils/branchConstants.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const buildDateFilter = (field, startDate, endDate) => {
  if (!startDate && !endDate) return {};
  const filter = {};
  filter[field] = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filter[field].$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter[field].$lte = end;
  }
  return filter;
};

export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const filter = buildDateFilter("date", startDate, endDate);
    if (branch && BRANCHES.includes(branch)) filter.branch = branch;

    const [
      dailyBreakdown,
      branchBreakdownRaw,
      slotBreakdown,
      totalsAgg,
      transfersAgg,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: filter },
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
        { $match: filter },
        {
          $group: {
            _id: "$branch",
            totalSale: { $sum: "$totalSale" },
            online: { $sum: "$online" },
            cash: { $sum: "$cash" },
          },
        },
      ]),
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$slot",
            totalSale: { $sum: "$totalSale" },
            online: { $sum: "$online" },
            cash: { $sum: "$cash" },
          },
        },
      ]),
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSale: { $sum: "$totalSale" },
            online: { $sum: "$online" },
            cash: { $sum: "$cash" },
            count: { $sum: 1 },
          },
        },
      ]),
      BranchTransfer.aggregate([
        { $match: buildDateFilter("date", startDate, endDate) },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const branchBreakdown = BRANCHES.map((b) => {
      const found = branchBreakdownRaw.find((x) => x._id === b);
      return {
        branch: b,
        label: BRANCH_LABELS[b],
        totalSale: found?.totalSale || 0,
        online: found?.online || 0,
        cash: found?.cash || 0,
      };
    });

    return sendSuccess(res, 200, "Sales report generated successfully", {
      dailyBreakdown,
      branchBreakdown,
      slotBreakdown,
      totals: {
        totalSale: totalsAgg[0]?.totalSale || 0,
        online: totalsAgg[0]?.online || 0,
        cash: totalsAgg[0]?.cash || 0,
        entryCount: totalsAgg[0]?.count || 0,
      },
      transfersTotal: transfersAgg[0]?.amount || 0,
      transfersCount: transfersAgg[0]?.count || 0,
    });
  } catch (error) {
    console.error("Sales report error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while generating the sales report",
    );
  }
};

export const getOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = buildDateFilter("createdAt", startDate, endDate);

    const [
      dailyBreakdown,
      statusBreakdown,
      paymentMethodBreakdown,
      tableBreakdown,
      totalsAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: filter },
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
        { $match: filter },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$tableNumber",
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0],
              },
            },
            paidCount: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const totalOrders = totalsAgg[0]?.totalOrders || 0;
    const totalRevenue = totalsAgg[0]?.totalRevenue || 0;
    const paidCount = totalsAgg[0]?.paidCount || 0;

    return sendSuccess(res, 200, "Orders report generated successfully", {
      dailyBreakdown,
      statusBreakdown,
      paymentMethodBreakdown,
      tableBreakdown,
      totals: {
        totalOrders,
        totalRevenue,
        averageOrderValue: paidCount > 0 ? totalRevenue / paidCount : 0,
      },
    });
  } catch (error) {
    console.error("Orders report error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while generating the orders report",
    );
  }
};

export const getEmployeeActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orderFilter = buildDateFilter("createdAt", startDate, endDate);
    const paymentFilter = buildDateFilter("date", startDate, endDate);

    const [employees, orderAgg, paymentAgg] = await Promise.all([
      Employee.find().select("name mobile status createdAt"),
      Order.aggregate([
        { $match: { ...orderFilter, assignedEmployee: { $ne: null } } },
        {
          $group: {
            _id: "$assignedEmployee",
            ordersHandled: { $sum: 1 },
            ordersRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0],
              },
            },
          },
        },
      ]),
      Payment.aggregate([
        { $match: { ...paymentFilter, submittedByEmployee: { $ne: null } } },
        {
          $group: {
            _id: "$submittedByEmployee",
            entriesSubmitted: { $sum: 1 },
            entriesTotal: { $sum: "$totalSale" },
          },
        },
      ]),
    ]);

    const activity = employees.map((emp) => {
      const orderStats = orderAgg.find(
        (o) => o._id.toString() === emp._id.toString(),
      );
      const paymentStats = paymentAgg.find(
        (p) => p._id.toString() === emp._id.toString(),
      );
      return {
        employeeId: emp._id,
        name: emp.name,
        mobile: emp.mobile,
        status: emp.status,
        ordersHandled: orderStats?.ordersHandled || 0,
        ordersRevenue: orderStats?.ordersRevenue || 0,
        entriesSubmitted: paymentStats?.entriesSubmitted || 0,
        entriesTotal: paymentStats?.entriesTotal || 0,
      };
    });

    activity.sort((a, b) => b.ordersHandled - a.ordersHandled);

    return sendSuccess(
      res,
      200,
      "Employee activity report generated successfully",
      { activity },
    );
  } catch (error) {
    console.error("Employee activity report error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while generating the employee activity report",
    );
  }
};

export const getTableActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orderFilter = buildDateFilter("createdAt", startDate, endDate);

    const [tables, orderAgg] = await Promise.all([
      Table.find().select("tableNumber status capacity"),
      Order.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: "$table",
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0],
              },
            },
          },
        },
      ]),
    ]);

    const activity = tables.map((t) => {
      const stats = orderAgg.find(
        (o) => o._id && o._id.toString() === t._id.toString(),
      );
      return {
        tableId: t._id,
        tableNumber: t.tableNumber,
        status: t.status,
        capacity: t.capacity,
        orders: stats?.orders || 0,
        revenue: stats?.revenue || 0,
      };
    });

    activity.sort((a, b) => b.orders - a.orders);

    const statusCounts = {
      AVAILABLE: tables.filter((t) => t.status === "AVAILABLE").length,
      OCCUPIED: tables.filter((t) => t.status === "OCCUPIED").length,
      RESERVED: tables.filter((t) => t.status === "RESERVED").length,
      OUT_OF_SERVICE: tables.filter((t) => t.status === "OUT_OF_SERVICE")
        .length,
    };

    return sendSuccess(
      res,
      200,
      "Table activity report generated successfully",
      { activity, statusCounts },
    );
  } catch (error) {
    console.error("Table activity report error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while generating the table activity report",
    );
  }
};
