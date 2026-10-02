import Employee from "../models/Employee.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString, isValidMobile } from "../utils/validators.js";
import { createNotification } from "../utils/notify.js";

export const createEmployee = async (req, res) => {
  try {
    const { name, mobile, password, status } = req.body;

    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(mobile) ||
      !isNonEmptyString(password)
    ) {
      return sendError(
        res,
        400,
        "Name, mobile number and password are required",
      );
    }

    if (!isValidMobile(mobile)) {
      return sendError(
        res,
        400,
        "Please provide a valid 10-digit mobile number",
      );
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long");
    }

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();

    const validStatuses = ["ACTIVE", "INACTIVE"];
    const employeeStatus =
      status && validStatuses.includes(status) ? status : "ACTIVE";

    const existingEmployee = await Employee.findOne({
      mobile: cleanMobile,
    });

    if (existingEmployee) {
      return sendError(
        res,
        409,
        "An employee with this mobile number already exists",
      );
    }

    const employee = await Employee.create({
      name: cleanName,
      mobile: cleanMobile,
      password,
      status: employeeStatus,
      role: "EMPLOYEE",
    });

    await createNotification({
      recipientRole: "ADMIN",
      type: "EMPLOYEE_CREATED",
      title: "Employee Added",
      message: `${employee.name} was added to the staff`,
      relatedEntityType: "Employee",
      relatedEntityId: employee._id,
    });

    return sendSuccess(res, 201, "Employee created successfully", {
      employee: {
        id: employee._id,
        name: employee.name,
        mobile: employee.mobile,
        status: employee.status,
        role: employee.role,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create employee error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "An employee with this mobile number already exists",
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return sendError(res, 400, messages || "Employee data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid employee data");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while creating the employee",
    );
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .sort({ createdAt: -1 })
      .select("-password");

    return sendSuccess(res, 200, "Employees fetched successfully", {
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return sendError(res, 500, "Something went wrong while fetching employees");
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");

    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    return sendSuccess(res, 200, "Employee fetched successfully", {
      employee,
    });
  } catch (error) {
    console.error("Get employee error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid employee ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while fetching the employee",
    );
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { name, mobile, password, status } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return sendError(res, 400, "Name cannot be empty");
      }

      employee.name = name.trim();
    }

    if (mobile !== undefined) {
      if (!isValidMobile(mobile)) {
        return sendError(
          res,
          400,
          "Please provide a valid 10-digit mobile number",
        );
      }

      const cleanMobile = mobile.trim();

      const duplicate = await Employee.findOne({
        mobile: cleanMobile,
        _id: { $ne: employee._id },
      });

      if (duplicate) {
        return sendError(
          res,
          409,
          "Another employee with this mobile number already exists",
        );
      }

      employee.mobile = cleanMobile;
    }

    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return sendError(
          res,
          400,
          "Password must be at least 6 characters long",
        );
      }

      employee.password = password;
    }

    if (status !== undefined) {
      if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return sendError(res, 400, "Status must be either ACTIVE or INACTIVE");
      }

      employee.status = status;
    }

    await employee.save();

    await createNotification({
      recipientRole: "ADMIN",
      type: "EMPLOYEE_UPDATED",
      title: "Employee Updated",
      message: `${employee.name}'s details were updated`,
      relatedEntityType: "Employee",
      relatedEntityId: employee._id,
    });

    return sendSuccess(res, 200, "Employee updated successfully", {
      employee: {
        id: employee._id,
        name: employee.name,
        mobile: employee.mobile,
        status: employee.status,
        role: employee.role,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "Another employee with this mobile number already exists",
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return sendError(res, 400, messages || "Employee data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid employee ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating the employee",
    );
  }
};

export const updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      return sendError(res, 400, "Status must be either ACTIVE or INACTIVE");
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    employee.status = status;

    await employee.save();

    await createNotification({
      recipientRole: "ADMIN",
      type: "EMPLOYEE_STATUS_CHANGED",
      title: `Employee ${status === "ACTIVE" ? "Activated" : "Deactivated"}`,
      message: `${employee.name} is now ${status}`,
      relatedEntityType: "Employee",
      relatedEntityId: employee._id,
    });

    return sendSuccess(res, 200, `Employee status updated to ${status}`, {
      employee: {
        id: employee._id,
        name: employee.name,
        mobile: employee.mobile,
        status: employee.status,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("Update employee status error:", error);

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating employee status",
    );
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    const employeeName = employee.name;

    await employee.deleteOne();

    await createNotification({
      recipientRole: "ADMIN",
      type: "EMPLOYEE_DELETED",
      title: "Employee Removed",
      message: `${employeeName} was removed from the staff`,
      relatedEntityType: "Employee",
      relatedEntityId: employee._id,
    });

    return sendSuccess(res, 200, "Employee deleted successfully", {});
  } catch (error) {
    console.error("Delete employee error:", error);

    return sendError(
      res,
      500,
      "Something went wrong while deleting the employee",
    );
  }
};
