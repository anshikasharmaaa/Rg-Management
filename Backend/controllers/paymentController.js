import Payment, {
  BRANCHES,
  SLOTS,
  PAYMENT_STATUSES,
} from "../models/Payment.js";
import BranchTransfer from "../models/BranchTransfer.js";
import Employee from "../models/Employee.js";
import { BRANCH_LABELS } from "../utils/branchConstants.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";
import { getIO } from "../socket/index.js";
import { createNotification } from "../utils/notify.js";

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const isValidAmount = (value) => {
  if (typeof value === "boolean") return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num) && num >= 0;
};

const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

const emitPaymentEvent = (payload) => {
  try {
    getIO().emit("payment_received", payload);
  } catch (error) {
    console.error("Socket emit failed (payment_received):", error.message);
  }
};

const generatePaymentId = async () => {
  const count = await Payment.countDocuments();
  let attempt = count + 1;
  let paymentId = `PAY-${1000 + attempt}`;

  while (await Payment.findOne({ paymentId })) {
    attempt += 1;
    paymentId = `PAY-${1000 + attempt}`;
  }

  return paymentId;
};

const validatePaymentInput = ({
  branch,
  date,
  slot,
  totalSale,
  online,
  cash,
}) => {
  if (!branch || !BRANCHES.includes(branch)) {
    return "A valid branch is required";
  }
  if (!date || Number.isNaN(new Date(date).getTime())) {
    return "A valid date is required";
  }
  if (!slot || !SLOTS.includes(slot)) {
    return "A valid slot (Morning or Evening) is required";
  }
  if (
    !isValidAmount(totalSale) ||
    !isValidAmount(online) ||
    !isValidAmount(cash)
  ) {
    return "Total sale, online and cash must be valid non-negative numbers";
  }

  const sum = round2(round2(online) + round2(cash));
  const total = round2(totalSale);

  if (Math.abs(sum - total) > 0.01) {
    return `Online (${round2(online)}) + Cash (${round2(cash)}) must equal Total Sale (${total})`;
  }

  return null;
};

const resolveSubmitter = async (req) => {
  if (req.user.role === "admin") {
    return {
      submittedByRole: "ADMIN",
      submittedByEmployee: null,
      submittedByName: "Admin",
    };
  }

  const employee = await Employee.findById(req.user.id).select("name");
  if (!employee) {
    return null;
  }

  return {
    submittedByRole: "EMPLOYEE",
    submittedByEmployee: employee._id,
    submittedByName: employee.name,
  };
};

export const createPayment = async (req, res) => {
  try {
    const { branch, date, slot, totalSale, online, cash, notes } = req.body;

    const validationError = validatePaymentInput({
      branch,
      date,
      slot,
      totalSale,
      online,
      cash,
    });
    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const submitter = await resolveSubmitter(req);
    if (!submitter) {
      return sendError(
        res,
        404,
        "Submitting employee account could not be found",
      );
    }

    const paymentId = await generatePaymentId();

    const payment = await Payment.create({
      paymentId,
      branch,
      date: normalizeDate(date),
      slot,
      totalSale: round2(totalSale),
      online: round2(online),
      cash: round2(cash),
      notes: isNonEmptyString(notes) ? notes.trim() : "",
      ...submitter,
    });

    emitPaymentEvent({ type: "PAYMENT_CREATED", payment });

    await createNotification({
      recipientRole: "ADMIN",
      type: "PAYMENT_ENTRY_CREATED",
      title: "Payment Entry Added",
      message: `${submitter.submittedByRole === "ADMIN" ? "Admin" : submitter.submittedByName} submitted a payment for ${BRANCH_LABELS[branch]} — ${slot === "MORNING" ? "Morning" : "Evening"} — ₹${round2(totalSale)}`,
      relatedEntityType: "Payment",
      relatedEntityId: payment._id,
    });

    return sendSuccess(res, 201, "Payment entry created successfully", {
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "A sales entry already exists for this branch, date and slot. Please edit the existing entry instead.",
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Payment data is invalid");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while creating the payment entry",
    );
  }
};

export const getPayments = async (req, res) => {
  try {
    const { branch, slot, date, startDate, endDate, employee, status, search } =
      req.query;

    const filter = {};

    if (req.user.role === "employee") {
      filter.submittedByEmployee = req.user.id;
    } else if (employee) {
      filter.submittedByEmployee = employee;
    }

    if (branch && BRANCHES.includes(branch)) filter.branch = branch;
    if (slot && SLOTS.includes(slot)) filter.slot = slot;
    if (status && PAYMENT_STATUSES.includes(status)) filter.status = status;

    if (date) {
      const start = normalizeDate(date);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
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
      const regex = { $regex: term, $options: "i" };
      const matchedBranches = Object.entries(BRANCH_LABELS)
        .filter(([, label]) => label.toLowerCase().includes(term.toLowerCase()))
        .map(([key]) => key);

      filter.$or = [
        { paymentId: regex },
        { submittedByName: regex },
        { notes: regex },
        ...(matchedBranches.length
          ? [{ branch: { $in: matchedBranches } }]
          : []),
      ];
    }

    const payments = await Payment.find(filter)
      .populate("submittedByEmployee", "name mobile")
      .sort({ date: -1, createdAt: -1 });

    return sendSuccess(res, 200, "Payments fetched successfully", { payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return sendError(res, 500, "Something went wrong while fetching payments");
  }
};

export const getPaymentSummary = async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const filter = {};

    if (branch && BRANCHES.includes(branch)) filter.branch = branch;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = normalizeDate(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    } else {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { branch: "$branch", slot: "$slot" },
          totalSale: { $sum: "$totalSale" },
          online: { $sum: "$online" },
          cash: { $sum: "$cash" },
          count: { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(res, 200, "Payment summary fetched successfully", {
      summary,
    });
  } catch (error) {
    console.error("Get payment summary error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching payment summary",
    );
  }
};

export const getBranchFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = normalizeDate(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    }

    const [salesAgg, transfersOutAgg, transfersInAgg] = await Promise.all([
      Payment.aggregate([
        { $match: dateFilter },
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
        { $match: dateFilter },
        { $group: { _id: "$fromBranch", amount: { $sum: "$amount" } } },
      ]),
      BranchTransfer.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$toBranch", amount: { $sum: "$amount" } } },
      ]),
    ]);

    const branches = BRANCHES.map((branchKey) => {
      const sales = salesAgg.find((s) => s._id === branchKey) || {
        totalSale: 0,
        online: 0,
        cash: 0,
      };
      const transfersOut =
        transfersOutAgg.find((t) => t._id === branchKey)?.amount || 0;
      const transfersIn =
        transfersInAgg.find((t) => t._id === branchKey)?.amount || 0;

      return {
        branch: branchKey,
        label: BRANCH_LABELS[branchKey],
        totalSale: sales.totalSale || 0,
        online: sales.online || 0,
        cash: sales.cash || 0,
        transfersOut,
        transfersIn,
        netPosition: (sales.totalSale || 0) + transfersIn - transfersOut,
      };
    });

    const overall = branches.reduce(
      (acc, b) => ({
        totalSale: acc.totalSale + b.totalSale,
        online: acc.online + b.online,
        cash: acc.cash + b.cash,
        totalTransfers: acc.totalTransfers + b.transfersOut,
      }),
      { totalSale: 0, online: 0, cash: 0, totalTransfers: 0 },
    );

    return sendSuccess(
      res,
      200,
      "Branch financial summary fetched successfully",
      {
        branches,
        overall,
      },
    );
  } catch (error) {
    console.error("Get branch financial summary error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching branch financial summary",
    );
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "submittedByEmployee",
      "name mobile",
    );

    if (!payment) {
      return sendError(res, 404, "Payment entry not found");
    }

    if (
      req.user.role === "employee" &&
      (!payment.submittedByEmployee ||
        payment.submittedByEmployee._id.toString() !== req.user.id)
    ) {
      return sendError(
        res,
        403,
        "You do not have access to this payment entry",
      );
    }

    return sendSuccess(res, 200, "Payment entry fetched successfully", {
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid payment ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while fetching the payment entry",
    );
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { branch, date, slot, totalSale, online, cash, notes } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return sendError(res, 404, "Payment entry not found");
    }

    if (
      req.user.role === "employee" &&
      (!payment.submittedByEmployee ||
        payment.submittedByEmployee.toString() !== req.user.id)
    ) {
      return sendError(res, 403, "You can only edit your own payment entries");
    }

    const nextBranch = branch !== undefined ? branch : payment.branch;
    const nextDate = date !== undefined ? date : payment.date;
    const nextSlot = slot !== undefined ? slot : payment.slot;
    const nextTotalSale =
      totalSale !== undefined ? totalSale : payment.totalSale;
    const nextOnline = online !== undefined ? online : payment.online;
    const nextCash = cash !== undefined ? cash : payment.cash;

    const validationError = validatePaymentInput({
      branch: nextBranch,
      date: nextDate,
      slot: nextSlot,
      totalSale: nextTotalSale,
      online: nextOnline,
      cash: nextCash,
    });

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    payment.branch = nextBranch;
    payment.date = normalizeDate(nextDate);
    payment.slot = nextSlot;
    payment.totalSale = round2(nextTotalSale);
    payment.online = round2(nextOnline);
    payment.cash = round2(nextCash);

    if (notes !== undefined) {
      payment.notes = notes.trim();
    }

    await payment.save();

    const populated = await Payment.findById(payment._id).populate(
      "submittedByEmployee",
      "name mobile",
    );

    emitPaymentEvent({ type: "PAYMENT_UPDATED", payment: populated });

    await createNotification({
      recipientRole: "ADMIN",
      type: "PAYMENT_ENTRY_UPDATED",
      title: "Payment Entry Updated",
      message: `Payment entry updated for ${BRANCH_LABELS[payment.branch]} — ${payment.slot === "MORNING" ? "Morning" : "Evening"}`,
      relatedEntityType: "Payment",
      relatedEntityId: payment._id,
    });

    return sendSuccess(res, 200, "Payment entry updated successfully", {
      payment: populated,
    });
  } catch (error) {
    console.error("Update payment error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "A sales entry already exists for this branch, date and slot.",
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Payment data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid payment ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating the payment entry",
    );
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !PAYMENT_STATUSES.includes(status)) {
      return sendError(
        res,
        400,
        "Status must be one of SUBMITTED, VERIFIED, REJECTED",
      );
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return sendError(res, 404, "Payment entry not found");
    }

    payment.status = status;
    await payment.save();

    const populated = await Payment.findById(payment._id).populate(
      "submittedByEmployee",
      "name mobile",
    );

    emitPaymentEvent({ type: "PAYMENT_STATUS_UPDATED", payment: populated });

    await createNotification({
      recipientRole: "ADMIN",
      type: "PAYMENT_STATUS_CHANGED",
      title: `Payment ${status}`,
      message: `Payment ${payment.paymentId} for ${BRANCH_LABELS[payment.branch]} is now ${status}`,
      relatedEntityType: "Payment",
      relatedEntityId: payment._id,
    });

    return sendSuccess(res, 200, `Payment status updated to ${status}`, {
      payment: populated,
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid payment ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating payment status",
    );
  }
};

export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return sendError(res, 404, "Payment entry not found");
    }

    await payment.deleteOne();

    emitPaymentEvent({ type: "PAYMENT_DELETED", paymentId: payment._id });

    await createNotification({
      recipientRole: "ADMIN",
      type: "PAYMENT_ENTRY_DELETED",
      title: "Payment Entry Deleted",
      message: `Payment entry ${payment.paymentId} was deleted`,
      relatedEntityType: "Payment",
      relatedEntityId: payment._id,
    });

    return sendSuccess(res, 200, "Payment entry deleted successfully", {});
  } catch (error) {
    console.error("Delete payment error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid payment ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while deleting the payment entry",
    );
  }
};
