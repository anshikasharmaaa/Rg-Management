import BranchTransfer from "../models/BranchTransfer.js";
import Employee from "../models/Employee.js";
import { BRANCHES, BRANCH_LABELS } from "../utils/branchConstants.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";
import { getIO } from "../socket/index.js";
import { createNotification } from "../utils/notify.js";

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const isValidAmount = (value) => {
  if (typeof value === "boolean") return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num) && num > 0;
};

const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

const emitTransferEvent = (payload) => {
  try {
    getIO().emit("branch_transfer_created", payload);
  } catch (error) {
    console.error(
      "Socket emit failed (branch_transfer_created):",
      error.message,
    );
  }
};

const generateTransferId = async () => {
  const count = await BranchTransfer.countDocuments();
  let attempt = count + 1;
  let transferId = `TRF-${1000 + attempt}`;

  while (await BranchTransfer.findOne({ transferId })) {
    attempt += 1;
    transferId = `TRF-${1000 + attempt}`;
  }

  return transferId;
};

const resolveCreator = async (req) => {
  if (req.user.role === "admin") {
    return {
      createdByRole: "ADMIN",
      createdByEmployee: null,
      createdByName: "Admin",
    };
  }

  const employee = await Employee.findById(req.user.id).select("name");
  if (!employee) return null;

  return {
    createdByRole: "EMPLOYEE",
    createdByEmployee: employee._id,
    createdByName: employee.name,
  };
};

export const createTransfer = async (req, res) => {
  try {
    const { fromBranch, toBranch, amount, date, notes } = req.body;

    if (!fromBranch || !BRANCHES.includes(fromBranch)) {
      return sendError(res, 400, "A valid source branch is required");
    }
    if (!toBranch || !BRANCHES.includes(toBranch)) {
      return sendError(res, 400, "A valid destination branch is required");
    }
    if (fromBranch === toBranch) {
      return sendError(
        res,
        400,
        "Source and destination branches must be different",
      );
    }
    if (!isValidAmount(amount)) {
      return sendError(
        res,
        400,
        "Transfer amount must be a valid number greater than 0",
      );
    }
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return sendError(res, 400, "A valid transfer date is required");
    }

    const creator = await resolveCreator(req);
    if (!creator) {
      return sendError(
        res,
        404,
        "Creating employee account could not be found",
      );
    }

    const transferId = await generateTransferId();

    const transfer = await BranchTransfer.create({
      transferId,
      fromBranch,
      toBranch,
      amount: round2(amount),
      date: normalizeDate(date),
      notes: isNonEmptyString(notes) ? notes.trim() : "",
      ...creator,
    });

    emitTransferEvent({ type: "TRANSFER_CREATED", transfer });

    await createNotification({
      recipientRole: "ADMIN",
      type: "BRANCH_TRANSFER_CREATED",
      title: "Branch Transfer Recorded",
      message: `₹${round2(amount)} transferred from ${BRANCH_LABELS[fromBranch]} to ${BRANCH_LABELS[toBranch]}`,
      relatedEntityType: "BranchTransfer",
      relatedEntityId: transfer._id,
    });

    return sendSuccess(res, 201, "Branch transfer created successfully", {
      transfer,
    });
  } catch (error) {
    console.error("Create transfer error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Transfer data is invalid");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while creating the transfer",
    );
  }
};

export const getTransfers = async (req, res) => {
  try {
    const { fromBranch, toBranch, startDate, endDate, search } = req.query;
    const filter = {};

    if (fromBranch && BRANCHES.includes(fromBranch))
      filter.fromBranch = fromBranch;
    if (toBranch && BRANCHES.includes(toBranch)) filter.toBranch = toBranch;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = normalizeDate(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (search && isNonEmptyString(search)) {
      const term = search.trim();
      filter.$or = [
        { transferId: { $regex: term, $options: "i" } },
        { notes: { $regex: term, $options: "i" } },
      ];
    }

    const transfers = await BranchTransfer.find(filter)
      .populate("createdByEmployee", "name mobile")
      .sort({ date: -1, createdAt: -1 });

    return sendSuccess(res, 200, "Transfers fetched successfully", {
      transfers,
    });
  } catch (error) {
    console.error("Get transfers error:", error);
    return sendError(res, 500, "Something went wrong while fetching transfers");
  }
};

export const getTransferById = async (req, res) => {
  try {
    const transfer = await BranchTransfer.findById(req.params.id).populate(
      "createdByEmployee",
      "name mobile",
    );

    if (!transfer) {
      return sendError(res, 404, "Transfer not found");
    }

    return sendSuccess(res, 200, "Transfer fetched successfully", { transfer });
  } catch (error) {
    console.error("Get transfer error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid transfer ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while fetching the transfer",
    );
  }
};

export const updateTransfer = async (req, res) => {
  try {
    const { fromBranch, toBranch, amount, date, notes } = req.body;

    const transfer = await BranchTransfer.findById(req.params.id);

    if (!transfer) {
      return sendError(res, 404, "Transfer not found");
    }

    const nextFrom =
      fromBranch !== undefined ? fromBranch : transfer.fromBranch;
    const nextTo = toBranch !== undefined ? toBranch : transfer.toBranch;

    if (!BRANCHES.includes(nextFrom) || !BRANCHES.includes(nextTo)) {
      return sendError(
        res,
        400,
        "A valid source and destination branch are required",
      );
    }

    if (nextFrom === nextTo) {
      return sendError(
        res,
        400,
        "Source and destination branches must be different",
      );
    }

    if (amount !== undefined) {
      if (!isValidAmount(amount)) {
        return sendError(
          res,
          400,
          "Transfer amount must be a valid number greater than 0",
        );
      }
      transfer.amount = round2(amount);
    }

    if (date !== undefined) {
      if (Number.isNaN(new Date(date).getTime())) {
        return sendError(res, 400, "A valid transfer date is required");
      }
      transfer.date = normalizeDate(date);
    }

    transfer.fromBranch = nextFrom;
    transfer.toBranch = nextTo;

    if (notes !== undefined) {
      transfer.notes = notes.trim();
    }

    await transfer.save();

    const populated = await BranchTransfer.findById(transfer._id).populate(
      "createdByEmployee",
      "name mobile",
    );

    emitTransferEvent({ type: "TRANSFER_UPDATED", transfer: populated });

    await createNotification({
      recipientRole: "ADMIN",
      type: "BRANCH_TRANSFER_UPDATED",
      title: "Branch Transfer Updated",
      message: `Transfer ${transfer.transferId} was updated`,
      relatedEntityType: "BranchTransfer",
      relatedEntityId: transfer._id,
    });

    return sendSuccess(res, 200, "Transfer updated successfully", {
      transfer: populated,
    });
  } catch (error) {
    console.error("Update transfer error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid transfer ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating the transfer",
    );
  }
};

export const deleteTransfer = async (req, res) => {
  try {
    const transfer = await BranchTransfer.findById(req.params.id);

    if (!transfer) {
      return sendError(res, 404, "Transfer not found");
    }

    await transfer.deleteOne();

    emitTransferEvent({ type: "TRANSFER_DELETED", transferId: transfer._id });

    await createNotification({
      recipientRole: "ADMIN",
      type: "BRANCH_TRANSFER_DELETED",
      title: "Branch Transfer Deleted",
      message: `Transfer ${transfer.transferId} was deleted`,
      relatedEntityType: "BranchTransfer",
      relatedEntityId: transfer._id,
    });

    return sendSuccess(res, 200, "Transfer deleted successfully", {});
  } catch (error) {
    console.error("Delete transfer error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid transfer ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while deleting the transfer",
    );
  }
};
