import Employee from "../models/Employee.js";
import generateToken from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString, isValidMobile } from "../utils/validators.js";

export const loginEmployee = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!isNonEmptyString(mobile) || !isNonEmptyString(password)) {
      return sendError(res, 400, "Mobile number and password are required");
    }

    if (!isValidMobile(mobile)) {
      return sendError(
        res,
        400,
        "Please provide a valid 10-digit mobile number",
      );
    }

    const employee = await Employee.findOne({ mobile: mobile.trim() }).select(
      "+password",
    );

    if (!employee) {
      return sendError(res, 401, "No account found with this mobile number");
    }

    if (employee.status !== "ACTIVE") {
      return sendError(
        res,
        403,
        "Your account has been deactivated. Please contact the admin",
      );
    }

    const isPasswordCorrect = await employee.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendError(res, 401, "Incorrect password");
    }

    const token = generateToken({
      id: employee._id.toString(),
      role: "employee",
      mobile: employee.mobile,
    });

    return sendSuccess(res, 200, "Employee login successful", {
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        mobile: employee.mobile,
        status: employee.status,
        role: employee.role,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Something went wrong during employee login");
  }
};
