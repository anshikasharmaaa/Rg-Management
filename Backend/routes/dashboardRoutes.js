import express from "express";
import {
  getDashboardOverview,
  getDashboardCharts,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/overview", getDashboardOverview);
router.get("/charts", getDashboardCharts);

export default router;
