import express from "express";
import {
  createPayment,
  getPayments,
  getPaymentSummary,
  getBranchFinancialSummary,
  getPaymentById,
  updatePayment,
  updatePaymentStatus,
  deletePayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/summary", requireAdmin, getPaymentSummary);
router.get(
  "/branch-financial-summary",
  requireAdmin,
  getBranchFinancialSummary,
);
router.get("/:id", getPaymentById);
router.put("/:id", updatePayment);
router.patch("/:id/status", requireAdmin, updatePaymentStatus);
router.delete("/:id", requireAdmin, deletePayment);

export default router;
