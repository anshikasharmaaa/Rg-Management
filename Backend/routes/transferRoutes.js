import express from "express";
import {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
} from "../controllers/transferController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.post("/", createTransfer);
router.get("/", getTransfers);
router.get("/:id", getTransferById);
router.put("/:id", updateTransfer);
router.delete("/:id", deleteTransfer);

export default router;
