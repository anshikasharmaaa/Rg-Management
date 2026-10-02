import mongoose from "mongoose";
import { BRANCHES } from "../utils/branchConstants.js";

const branchTransferSchema = new mongoose.Schema(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
    },
    fromBranch: {
      type: String,
      enum: BRANCHES,
      required: [true, "Source branch is required"],
    },
    toBranch: {
      type: String,
      enum: BRANCHES,
      required: [true, "Destination branch is required"],
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Transfer amount must be greater than 0"],
    },
    date: {
      type: Date,
      required: [true, "Transfer date is required"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdByRole: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE"],
      required: true,
    },
    createdByEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const BranchTransfer = mongoose.model("BranchTransfer", branchTransferSchema);

export default BranchTransfer;
