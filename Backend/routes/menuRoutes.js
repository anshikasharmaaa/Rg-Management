import express from "express";
import {
  createMenuItem,
  getMenuItems,
  getPublicMenu,
  searchPublicMenu,
  getPublicMenuItemById,
  getMenuItemById,
  updateMenuItem,
  updateMenuItemStatus,
  updateMenuItemAvailability,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { uploadMenuImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ---- PUBLIC (no auth) ----
// Powers the public Home page / Menu page. Only active + available items.
router.get("/public", getPublicMenu);
// Home page search panel. Must be declared before "/public/:id".
router.get("/public/search", searchPublicMenu);
// Public item details page (/menu/:id on the frontend).
router.get("/public/:id", getPublicMenuItemById);

// ---- AUTHENTICATED, READ-ONLY (admin OR employee token) ----
// `protect` only verifies the JWT is valid; it does not check role, so
// both admin and employee tokens are accepted here. This is intentionally
// the single read path both dashboards use, per the "one source of truth"
// requirement.
router.get("/", protect, getMenuItems);
router.get("/:id", protect, getMenuItemById);

// ---- ADMIN-ONLY WRITE OPERATIONS ----
// requireAdmin rejects any employee token with 403, regardless of what the
// frontend does or doesn't render — the real enforcement lives here.
router.post("/", protect, requireAdmin, uploadMenuImage, createMenuItem);
router.put("/:id", protect, requireAdmin, uploadMenuImage, updateMenuItem);
router.patch("/:id/status", protect, requireAdmin, updateMenuItemStatus);
router.patch(
  "/:id/availability",
  protect,
  requireAdmin,
  updateMenuItemAvailability,
);
router.delete("/:id", protect, requireAdmin, deleteMenuItem);

export default router;
