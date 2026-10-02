import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/Sidebar.jsx";
import AdminTopbar from "../components/admin/Topbar.jsx";
import { NotificationProvider } from "../context/NotificationContext.jsx";

const AdminLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <NotificationProvider role="admin">
      <div className="min-h-screen bg-gray-50">
        <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <AdminSidebar
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

export default AdminLayout;