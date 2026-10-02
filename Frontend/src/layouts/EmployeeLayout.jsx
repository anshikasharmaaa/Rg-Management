import { useState } from "react";
import { Outlet } from "react-router-dom";
import EmployeeSidebar from "../components/employee/Sidebar.jsx";
import EmployeeTopbar from "../components/employee/Topbar.jsx";
import { NotificationProvider } from "../context/NotificationContext.jsx";

const EmployeeLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <NotificationProvider role="employee">
      <div className="min-h-screen bg-gray-50">
        <EmployeeTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <EmployeeSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="lg:pl-64">
          <main className="p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default EmployeeLayout;