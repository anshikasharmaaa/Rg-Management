import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Utensils, Bell, Wallet, LogOut, X } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import useNotifications from "../../hooks/useNotifications.js";
import { ROUTES } from "../../utils/routes.js";

const E = ROUTES.EMPLOYEE;

const navItems = [
  { label: "Dashboard", path: E.DASHBOARD, icon: LayoutDashboard },
  { label: "Orders", path: E.ORDERS, icon: ClipboardList },
  { label: "Payments", path: E.PAYMENTS, icon: Wallet },
  { label: "Tables", path: E.TABLES, icon: Utensils },
  { label: "Notifications", path: E.NOTIFICATIONS, icon: Bell, badge: true },
];

const EmployeeSidebar = ({ mobileOpen, onMobileClose }) => {
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();

  const renderNav = (onNavigate) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {navItems.map(({ label, path, icon: Icon, badge }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
              ? "border border-gold-200 bg-gold-50 text-gold-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          <span className="flex items-center gap-3">
            <Icon size={18} />
            {label}
          </span>
          {badge && unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-charcoal-950">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-gray-200 p-3">
      <button
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <p className="px-6 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-gold-600">
          Employee Panel
        </p>
        {renderNav()}
        {footer}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-gray-200 bg-white">
            <div className="flex items-center justify-between px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                Employee Panel
              </p>
              <button onClick={onMobileClose} aria-label="Close menu" className="text-gray-500 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
            {renderNav(onMobileClose)}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
};

export default EmployeeSidebar;