import express from "express";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  updateTableStatus,
  regenerateTableQR,
  deleteTable,
} from "../controllers/tableController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect);

// Readable by both admin and employee
router.get("/", getTables);
router.get("/:id", getTableById);

// Status changes allowed for both admin and employee (e.g. serving staff clearing a table)
router.patch("/:id/status", updateTableStatus);

// Structural changes remain admin-only
router.post("/", requireAdmin, createTable);
router.put("/:id", requireAdmin, updateTable);
router.patch("/:id/regenerate-qr", requireAdmin, regenerateTableQR);
router.delete("/:id", requireAdmin, deleteTable);

export default router;
