import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/public/Home.jsx";
import MenuPage from "./components/public/MenuPage.jsx";
import MenuItemPage from "./components/public/MenuItemPage.jsx";
import ContactPage from "./components/public/ContactPage.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StaffManagement from "./pages/admin/StaffManagement.jsx";
import Tables from "./pages/admin/Tables.jsx";
import QRManagement from "./pages/admin/QRManagement.jsx";
import Categories from "./pages/admin/Categories.jsx";
import Menu from "./pages/admin/Menu.jsx";
import Orders from "./pages/admin/Orders.jsx";
import Payments from "./pages/admin/Payments.jsx";
import Reports from "./pages/admin/Reports.jsx";
import Notifications from "./pages/admin/Notifications.jsx";
import Settings from "./pages/admin/Settings.jsx";
import EmployeeLogin from "./pages/employee/EmployeeLogin.jsx";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard.jsx";
import EmployeeOrders from "./pages/employee/EmployeeOrders.jsx";
import EmployeePayments from "./pages/employee/EmployeePayments.jsx";
import EmployeeTables from "./pages/employee/EmployeeTables.jsx";
import EmployeeNotifications from "./pages/employee/EmployeeNotifications.jsx";
import Profile from "./pages/common/Profile.jsx";
import NotFound from "./pages/common/NotFound.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import EmployeeLayout from "./layouts/EmployeeLayout.jsx";
import AdminProtectedRoute from "./components/common/AdminProtectedRoute.jsx";
import EmployeeProtectedRoute from "./components/common/EmployeeProtectedRoute.jsx";
import { ROUTES } from "./utils/routes.js";

function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/menu/:id" element={<MenuItemPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<EmployeeLogin />} />
      <Route path="/employee/login" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Employee panel */}
      <Route
        path="/employee"
        element={
          <EmployeeProtectedRoute>
            <EmployeeLayout />
          </EmployeeProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="orders" element={<EmployeeOrders />} />
        <Route path="payments" element={<EmployeePayments />} />
        <Route path="tables" element={<EmployeeTables />} />
        <Route path="notifications" element={<EmployeeNotifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin panel. The real security boundary is AdminProtectedRoute + backend requireAdmin. */}
      <Route path="/admin-portal/login" element={<AdminLogin />} />
      <Route
        path="/admin-portal"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="tables" element={<Tables />} />
        <Route path="qr-management" element={<QRManagement />} />
        <Route path="categories" element={<Categories />} />
        <Route path="menu" element={<Menu />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* /admin is not a real route — send old bookmarks/links to the admin panel */}
      <Route path="/admin" element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
      <Route path="/admin/*" element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;