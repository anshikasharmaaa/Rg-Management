import express from "express";
import {
  createOrder,
  getOrders,
  getOrderStats,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  assignEmployee,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/stats/summary", getOrderStats);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment-status", updatePaymentStatus);
router.patch("/:id/assign", requireAdmin, assignEmployee);
router.delete("/:id", requireAdmin, deleteOrder);

export default router;
