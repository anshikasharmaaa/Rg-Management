import Order from "../models/Order.js";

export const computeOrderStats = async (baseFilter = {}) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    servedOrders,
    completedOrders,
    cancelledOrders,
    todayOrders,
    revenueAgg,
    todayRevenueAgg,
  ] = await Promise.all([
    Order.countDocuments(baseFilter),
    Order.countDocuments({ ...baseFilter, orderStatus: "PENDING" }),
    Order.countDocuments({ ...baseFilter, orderStatus: "CONFIRMED" }),
    Order.countDocuments({ ...baseFilter, orderStatus: "PREPARING" }),
    Order.countDocuments({ ...baseFilter, orderStatus: "READY" }),
    Order.countDocuments({ ...baseFilter, orderStatus: "SERVED" }),
    Order.countDocuments({ ...baseFilter, orderStatus: "COMPLETED" }),
    Order.countDocuments({ ...baseFilter, orderStatus: "CANCELLED" }),
    Order.countDocuments({
      ...baseFilter,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Order.aggregate([
      { $match: { ...baseFilter, paymentStatus: "PAID" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ...baseFilter,
          paymentStatus: "PAID",
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const paidOrderCount = revenueAgg[0]?.count || 0;
  const todayRevenue = todayRevenueAgg[0]?.total || 0;
  const averageOrderValue =
    paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    servedOrders,
    completedOrders,
    cancelledOrders,
    todayOrders,
    totalRevenue,
    todayRevenue,
    averageOrderValue,
  };
};
