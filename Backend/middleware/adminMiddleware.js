import { sendError } from "../utils/apiResponse.js";

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return sendError(res, 403, "Forbidden: Admin access required");
  }
  next();
};
