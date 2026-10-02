import { sendError } from "../utils/apiResponse.js";

export const requireEmployee = (req, res, next) => {
  if (!req.user || req.user.role !== "employee") {
    return sendError(res, 403, "Forbidden: Employee access required");
  }
  next();
};
