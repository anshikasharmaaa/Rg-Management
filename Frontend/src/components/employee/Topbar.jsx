import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import useNotifications from "../../hooks/useNotifications.js";
import Header from "../shared/Header.jsx";
import EmployeeNotificationPanel from "./NotificationPanel.jsx";

// The dashboard top bar IS the shared site Header (Home / Dashboard / Profile /
// Logout), with the notification bell injected through `rightSlot`.
const EmployeeTopbar = ({ onMenuClick }) => {
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const bell = (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setNotifOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[9px] font-bold text-charcoal-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {notifOpen && <EmployeeNotificationPanel onClose={() => setNotifOpen(false)} />}
    </div>
  );

  return <Header fluid onSidebarToggle={onMenuClick} rightSlot={bell} />;
};

export default EmployeeTopbar;