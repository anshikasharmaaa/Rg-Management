import mongoose from "mongoose";
import crypto from "crypto";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, "Table number is required"],
      unique: true,
      trim: true,
    },

    capacity: {
      type: Number,
      default: 2,
      min: [1, "Capacity must be at least 1"],
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"],
      default: "AVAILABLE",
    },

    qrCode: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
  },
  {
    timestamps: true,
  },
);

const Table = mongoose.model("Table", tableSchema);

export default Table;
