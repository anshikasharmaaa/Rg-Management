import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.post("/", createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.patch("/:id/status", updateCategoryStatus);
router.delete("/:id", deleteCategory);

export default router;
