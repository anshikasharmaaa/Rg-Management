import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.patch("/:id/status", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);

export default router;
