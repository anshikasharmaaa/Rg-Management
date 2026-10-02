import express from "express";
import { globalSearch } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/", globalSearch);

export default router;
