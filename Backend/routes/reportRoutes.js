import express from "express";
import {
  getSalesReport,
  getOrdersReport,
  getEmployeeActivityReport,
  getTableActivityReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/sales", getSalesReport);
router.get("/orders", getOrdersReport);
router.get("/employees", getEmployeeActivityReport);
router.get("/tables", getTableActivityReport);

export default router;
