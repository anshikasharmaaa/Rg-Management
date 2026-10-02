import { Navigate, useLocation } from "react-router-dom";
import useAdminAuth from "../../hooks/useAdminAuth.js";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { ROUTES } from "../../utils/routes.js";

const EmployeeProtectedRoute = ({ children }) => {
  const employee = useEmployeeAuth();
  const admin = useAdminAuth();
  const location = useLocation();

  if (employee.initializing || admin.initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!employee.isAuthenticated) {
    if (admin.isAuthenticated) {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    // The employee login lives at /login (there is no /employee/login page)
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return children;
};

export default EmployeeProtectedRoute;