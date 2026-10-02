import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    customerMobile: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, "Order must have at least one item"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "ONLINE"],
      default: "CASH",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "SERVED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
