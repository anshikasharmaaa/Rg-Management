import generateToken from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isValidEmail, isNonEmptyString } from "../utils/validators.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return sendError(res, 400, "Email and password are required");
    }

    if (!isValidEmail(email)) {
      return sendError(res, 400, "Please provide a valid email address");
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return sendError(
        res,
        500,
        "Admin credentials are not configured on the server",
      );
    }

    if (
      email.trim().toLowerCase() !== adminEmail.trim().toLowerCase() ||
      password !== adminPassword
    ) {
      return sendError(res, 401, "Invalid email or password");
    }

    const token = generateToken({
      id: "admin",
      role: "admin",
      email: adminEmail,
    });

    return sendSuccess(res, 200, "Admin login successful", {
      token,
      admin: {
        email: adminEmail,
        role: "admin",
      },
    });
  } catch (error) {
    return sendError(res, 500, "Something went wrong during admin login");
  }
};
