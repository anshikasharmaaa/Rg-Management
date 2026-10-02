import mongoose from "mongoose";
import { BRANCHES } from "../utils/branchConstants.js";

export const SLOTS = ["MORNING", "EVENING"];
export const PAYMENT_STATUSES = ["SUBMITTED", "VERIFIED", "REJECTED"];
export { BRANCHES };

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    branch: {
      type: String,
      enum: BRANCHES,
      required: [true, "Branch is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    slot: {
      type: String,
      enum: SLOTS,
      required: [true, "Slot is required"],
    },
    totalSale: {
      type: Number,
      required: true,
      min: [0, "Total sale cannot be negative"],
    },
    online: {
      type: Number,
      required: true,
      min: [0, "Online amount cannot be negative"],
    },
    cash: {
      type: Number,
      required: true,
      min: [0, "Cash amount cannot be negative"],
    },
    submittedByRole: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE"],
      required: true,
    },
    submittedByEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    submittedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "SUBMITTED",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

paymentSchema.index({ branch: 1, date: 1, slot: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
