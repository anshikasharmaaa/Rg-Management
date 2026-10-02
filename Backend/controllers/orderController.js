import Order from "../models/Order.js";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";
import Employee from "../models/Employee.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";
import { getIO } from "../socket/index.js";
import { createNotification } from "../utils/notify.js";
import { computeOrderStats } from "../utils/orderStats.js";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];
const PAYMENT_METHODS = ["CASH", "ONLINE"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];
const ACTIVE_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
];

const generateOrderId = async () => {
  const count = await Order.countDocuments();
  let attempt = count + 1;
  let orderId = `RG-${1000 + attempt}`;

  while (await Order.findOne({ orderId })) {
    attempt += 1;
    orderId = `RG-${1000 + attempt}`;
  }

  return orderId;
};

const emitOrderEvent = (eventName, payload) => {
  try {
    getIO().emit(eventName, payload);
  } catch (error) {
    console.error(`Socket emit failed (${eventName}):`, error.message);
  }
};

export const createOrder = async (req, res) => {
  try {
    const { tableId, customerName, customerMobile, items, paymentMethod } =
      req.body;

    if (!tableId) {
      return sendError(res, 400, "Table is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, "Order must include at least one item");
    }

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return sendError(res, 400, "Invalid payment method");
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const rawItem of items) {
      const { menuItemId, quantity } = rawItem;

      if (!menuItemId || !quantity || quantity < 1) {
        return sendError(
          res,
          400,
          "Each item requires a valid menu item and quantity",
        );
      }

      const menuItem = await MenuItem.findById(menuItemId);

      if (!menuItem) {
        return sendError(res, 404, `Menu item not found: ${menuItemId}`);
      }

      if (!menuItem.isActive || !menuItem.isAvailable) {
        return sendError(res, 400, `${menuItem.name} is currently unavailable`);
      }

      const subtotal = menuItem.price * quantity;
      totalAmount += subtotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        subtotal,
      });
    }

    const orderId = await generateOrderId();

    const order = await Order.create({
      orderId,
      table: table._id,
      tableNumber: table.tableNumber,
      customerName: isNonEmptyString(customerName) ? customerName.trim() : "",
      customerMobile: isNonEmptyString(customerMobile)
        ? customerMobile.trim()
        : "",
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || "CASH",
    });

    if (table.status !== "OUT_OF_SERVICE") {
      table.status = "OCCUPIED";
      await table.save();
      emitOrderEvent("table_status_changed", {
        id: table._id,
        tableNumber: table.tableNumber,
        status: table.status,
      });
    }

    emitOrderEvent("new_order", order);

    await createNotification({
      recipientRole: "ADMIN",
      type: "ORDER_CREATED",
      title: "New Order Received",
      message: `Order ${order.orderId} placed for Table ${order.tableNumber}`,
      relatedEntityType: "Order",
      relatedEntityId: order._id,
    });

    return sendSuccess(res, 201, "Order created successfully", { order });
  } catch (error) {
    console.error("Create order error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Order data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid ID provided");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while creating the order",
    );
  }
};

export const getOrders = async (req, res) => {
  try {
    const {
      date,
      status,
      paymentStatus,
      paymentMethod,
      table,
      employee,
      search,
    } = req.query;

    const filter = {};

    if (req.user.role === "employee") {
      filter.assignedEmployee = req.user.id;
    } else if (employee) {
      filter.assignedEmployee = employee;
    }

    if (status && ORDER_STATUSES.includes(status)) {
      filter.orderStatus = status;
    }

    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod && PAYMENT_METHODS.includes(paymentMethod)) {
      filter.paymentMethod = paymentMethod;
    }

    if (table) {
      filter.table = table;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (search && isNonEmptyString(search)) {
      const regex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { orderId: regex },
        { customerName: regex },
        { customerMobile: regex },
        { tableNumber: regex },
      ];
    }

    const orders = await Order.find(filter)
      .populate("assignedEmployee", "name mobile")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Orders fetched successfully", { orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return sendError(res, 500, "Something went wrong while fetching orders");
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const baseFilter =
      req.user.role === "employee" ? { assignedEmployee: req.user.id } : {};
    const stats = await computeOrderStats(baseFilter);
    return sendSuccess(res, 200, "Order statistics fetched successfully", {
      stats,
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching order statistics",
    );
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "assignedEmployee",
      "name mobile",
    );

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (
      req.user.role === "employee" &&
      (!order.assignedEmployee ||
        order.assignedEmployee._id.toString() !== req.user.id)
    ) {
      return sendError(res, 403, "You are not assigned to this order");
    }

    return sendSuccess(res, 200, "Order fetched successfully", { order });
  } catch (error) {
    console.error("Get order error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid order ID");
    }

    return sendError(res, 500, "Something went wrong while fetching the order");
  }
};

const releaseTableIfClear = async (order) => {
  const activeCount = await Order.countDocuments({
    table: order.table,
    orderStatus: { $in: ACTIVE_ORDER_STATUSES },
  });

  if (activeCount === 0) {
    const table = await Table.findById(order.table);
    if (table && table.status !== "OUT_OF_SERVICE") {
      table.status = "AVAILABLE";
      await table.save();
      emitOrderEvent("table_status_changed", {
        id: table._id,
        tableNumber: table.tableNumber,
        status: table.status,
      });
    }
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !ORDER_STATUSES.includes(status)) {
      return sendError(res, 400, "Invalid order status");
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (
      req.user.role === "employee" &&
      (!order.assignedEmployee ||
        order.assignedEmployee.toString() !== req.user.id)
    ) {
      return sendError(res, 403, "You are not assigned to this order");
    }

    order.orderStatus = status;
    await order.save();

    emitOrderEvent("order_status_changed", {
      id: order._id,
      orderId: order.orderId,
      status: order.orderStatus,
    });

    if (["COMPLETED", "CANCELLED"].includes(status)) {
      await releaseTableIfClear(order);
    }

    await createNotification({
      recipientRole: "ADMIN",
      type: "ORDER_STATUS_CHANGED",
      title: `Order ${order.orderId} - ${status}`,
      message: `Order ${order.orderId} for Table ${order.tableNumber} is now ${status}`,
      relatedEntityType: "Order",
      relatedEntityId: order._id,
    });

    return sendSuccess(res, 200, `Order status updated to ${status}`, {
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid order ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating order status",
    );
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!paymentStatus || !PAYMENT_STATUSES.includes(paymentStatus)) {
      return sendError(res, 400, "Invalid payment status");
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    emitOrderEvent("payment_received", {
      id: order._id,
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
    });

    await createNotification({
      recipientRole: "ADMIN",
      type: "PAYMENT_STATUS_CHANGED",
      title: `Payment ${paymentStatus} - ${order.orderId}`,
      message: `Payment for order ${order.orderId} is now ${paymentStatus}`,
      relatedEntityType: "Order",
      relatedEntityId: order._id,
    });

    return sendSuccess(res, 200, `Payment status updated to ${paymentStatus}`, {
      order,
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid order ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating payment status",
    );
  }
};

export const assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return sendError(res, 404, "Employee not found");
      }
      order.assignedEmployee = employee._id;
      await order.save();

      await createNotification({
        recipientRole: "EMPLOYEE",
        recipientId: employee._id,
        type: "ORDER_ASSIGNED",
        title: `Order ${order.orderId} Assigned`,
        message: `You have been assigned to order ${order.orderId} for Table ${order.tableNumber}`,
        relatedEntityType: "Order",
        relatedEntityId: order._id,
      });
    } else {
      order.assignedEmployee = null;
      await order.save();
    }

    const populatedOrder = await Order.findById(order._id).populate(
      "assignedEmployee",
      "name mobile",
    );

    emitOrderEvent("order_updated", populatedOrder);

    return sendSuccess(res, 200, "Order employee assignment updated", {
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Assign employee error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid ID provided");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while assigning the employee",
    );
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    await order.deleteOne();

    return sendSuccess(res, 200, "Order deleted successfully", {});
  } catch (error) {
    console.error("Delete order error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid order ID");
    }

    return sendError(res, 500, "Something went wrong while deleting the order");
  }
};
