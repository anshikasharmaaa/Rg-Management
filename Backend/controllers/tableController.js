import crypto from "crypto";
import Table from "../models/Table.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";
import { getIO } from "../socket/index.js";
import { createNotification } from "../utils/notify.js";

const VALID_STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"];

const emitTableStatusChanged = (table) => {
  try {
    getIO().emit("table_status_changed", {
      id: table._id,
      tableNumber: table.tableNumber,
      status: table.status,
    });
  } catch (error) {
    console.error("Socket emit failed (table_status_changed):", error.message);
  }
};

export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    if (!isNonEmptyString(tableNumber)) {
      return sendError(res, 400, "Table number is required");
    }

    const cleanTableNumber = tableNumber.trim();

    if (
      capacity !== undefined &&
      (!Number.isInteger(capacity) || capacity < 1)
    ) {
      return sendError(res, 400, "Capacity must be a positive whole number");
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return sendError(res, 400, "Invalid table status");
    }

    const existingTable = await Table.findOne({
      tableNumber: cleanTableNumber,
    });

    if (existingTable) {
      return sendError(res, 409, "A table with this number already exists");
    }

    const table = await Table.create({
      tableNumber: cleanTableNumber,
      capacity: capacity || 2,
      status: status || "AVAILABLE",
    });

    await createNotification({
      recipientRole: "ADMIN",
      type: "TABLE_CREATED",
      title: "Table Added",
      message: `Table ${table.tableNumber} was added`,
      relatedEntityType: "Table",
      relatedEntityId: table._id,
    });

    return sendSuccess(res, 201, "Table created successfully", { table });
  } catch (error) {
    console.error("Create table error:", error);

    if (error.code === 11000) {
      return sendError(res, 409, "A table with this number already exists");
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Table data is invalid");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while creating the table",
    );
  }
};

export const getTables = async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {};

    if (search && isNonEmptyString(search)) {
      filter.tableNumber = { $regex: search.trim(), $options: "i" };
    }

    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const tables = await Table.find(filter).sort({ createdAt: 1 });

    return sendSuccess(res, 200, "Tables fetched successfully", { tables });
  } catch (error) {
    console.error("Get tables error:", error);
    return sendError(res, 500, "Something went wrong while fetching tables");
  }
};

export const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    return sendSuccess(res, 200, "Table fetched successfully", { table });
  } catch (error) {
    console.error("Get table error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid table ID");
    }

    return sendError(res, 500, "Something went wrong while fetching the table");
  }
};

export const updateTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    if (tableNumber !== undefined) {
      if (!isNonEmptyString(tableNumber)) {
        return sendError(res, 400, "Table number cannot be empty");
      }

      const cleanTableNumber = tableNumber.trim();

      const duplicate = await Table.findOne({
        tableNumber: cleanTableNumber,
        _id: { $ne: table._id },
      });

      if (duplicate) {
        return sendError(
          res,
          409,
          "Another table with this number already exists",
        );
      }

      table.tableNumber = cleanTableNumber;
    }

    if (capacity !== undefined) {
      if (!Number.isInteger(capacity) || capacity < 1) {
        return sendError(res, 400, "Capacity must be a positive whole number");
      }

      table.capacity = capacity;
    }

    let statusChanged = false;

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return sendError(res, 400, "Invalid table status");
      }

      statusChanged = table.status !== status;
      table.status = status;
    }

    await table.save();

    if (statusChanged) {
      emitTableStatusChanged(table);
      await createNotification({
        recipientRole: "ADMIN",
        type: "TABLE_STATUS_CHANGED",
        title: `Table ${table.tableNumber} - ${table.status}`,
        message: `Table ${table.tableNumber} is now ${table.status}`,
        relatedEntityType: "Table",
        relatedEntityId: table._id,
      });
    }

    return sendSuccess(res, 200, "Table updated successfully", { table });
  } catch (error) {
    console.error("Update table error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "Another table with this number already exists",
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Table data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid table ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating the table",
    );
  }
};

export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return sendError(
        res,
        400,
        "Status must be one of AVAILABLE, OCCUPIED, RESERVED, OUT_OF_SERVICE",
      );
    }

    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    table.status = status;
    await table.save();

    emitTableStatusChanged(table);

    await createNotification({
      recipientRole: "ADMIN",
      type: "TABLE_STATUS_CHANGED",
      title: `Table ${table.tableNumber} - ${status}`,
      message: `Table ${table.tableNumber} is now ${status}`,
      relatedEntityType: "Table",
      relatedEntityId: table._id,
    });

    return sendSuccess(res, 200, `Table status updated to ${status}`, {
      table,
    });
  } catch (error) {
    console.error("Update table status error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid table ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating table status",
    );
  }
};

export const regenerateTableQR = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    table.qrCode = crypto.randomUUID();
    await table.save();

    return sendSuccess(res, 200, "QR code regenerated successfully", { table });
  } catch (error) {
    console.error("Regenerate table QR error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid table ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while regenerating the QR code",
    );
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    await table.deleteOne();

    return sendSuccess(res, 200, "Table deleted successfully", {});
  } catch (error) {
    console.error("Delete table error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid table ID");
    }

    return sendError(res, 500, "Something went wrong while deleting the table");
  }
};
