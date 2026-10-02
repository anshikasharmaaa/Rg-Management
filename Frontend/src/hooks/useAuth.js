import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuthContext } from "../context/AdminAuthContext.jsx";
import { EmployeeAuthContext } from "../context/EmployeeAuthContext.jsx";
import { ROUTES } from "../utils/routes.js";

// Single source of truth for "who is logged in right now". Reads the two
// existing contexts, so the header updates instantly on login/logout.
const useAuth = () => {
  const adminCtx = useContext(AdminAuthContext);
  const employeeCtx = useContext(EmployeeAuthContext);
  const navigate = useNavigate();

  const isAdmin = Boolean(adminCtx?.isAuthenticated);
  const isEmployee = Boolean(employeeCtx?.isAuthenticated);

  let user = null;
  let role = null;
  let dashboardPath = null;
  let profilePath = null;

  if (isAdmin) {
    role = "admin";
    user = {
      id: "admin",
      name: "Admin",
      email: adminCtx.admin?.email || "",
      role: "Admin",
    };
    dashboardPath = ROUTES.ADMIN.DASHBOARD;
    profilePath = ROUTES.ADMIN.PROFILE;
  } else if (isEmployee) {
    role = "employee";
    user = {
      id: employeeCtx.employee?.id,
      name: employeeCtx.employee?.name || "Employee",
      email: employeeCtx.employee?.mobile || "",
      mobile: employeeCtx.employee?.mobile || "",
      status: employeeCtx.employee?.status || "",
      role: "Employee",
    };
    dashboardPath = ROUTES.EMPLOYEE.DASHBOARD;
    profilePath = ROUTES.EMPLOYEE.PROFILE;
  }

  const logout = () => {
    if (isAdmin) adminCtx.logout();
    if (isEmployee) employeeCtx.logout();
    navigate(isAdmin ? ROUTES.ADMIN.LOGIN : ROUTES.HOME, { replace: true });
  };

  return {
    isAuthenticated: isAdmin || isEmployee,
    role,
    user,
    logout,
    dashboardPath,
    profilePath,
  };
};

export default useAuth;
