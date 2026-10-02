import { Navigate, useLocation } from "react-router-dom";
import useAdminAuth from "../../hooks/useAdminAuth.js";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { ROUTES } from "../../utils/routes.js";

const AdminProtectedRoute = ({ children }) => {
  const admin = useAdminAuth();
  const employee = useEmployeeAuth();
  const location = useLocation();

  if (admin.initializing || employee.initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!admin.isAuthenticated) {
    // A logged-in employee is not allowed here — send them back to their panel.
    if (employee.isAuthenticated) {
      return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.ADMIN.LOGIN} replace state={{ from: location }} />;
  }

  return children;
};

export default AdminProtectedRoute;