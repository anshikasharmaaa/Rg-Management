import { useNavigate } from "react-router-dom";
import { CheckCheck, Bell } from "lucide-react";
import useNotifications from "../../hooks/useNotifications.js";

const ENTITY_ROUTES = {
  Order: "/admin-portal/orders",
  MenuItem: "/admin-portal/menu",
  Category: "/admin-portal/categories",
  Employee: "/admin-portal/staff",
  Table: "/admin-portal/tables",
  Payment: "/admin-portal/payments",
  BranchTransfer: "/admin-portal/payments",
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    const route = ENTITY_ROUTES[notification.relatedEntityType];
    if (route) {
      navigate(route);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-card sm:w-96">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-gold-600 hover:underline"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell size={22} className="text-gray-300" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <button
              key={notification._id}
              onClick={() => handleClick(notification)}
              className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50 ${!notification.isRead ? "bg-gold-50/60" : ""
                }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                {!notification.isRead && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                )}
              </div>
              <p className="line-clamp-2 text-xs text-gray-500">{notification.message}</p>
              <p className="mt-1 text-[10px] text-gray-400">{timeAgo(notification.createdAt)}</p>
            </button>
          ))
        )}
      </div>

      <button
        onClick={() => {
          navigate("/admin-portal/notifications");
          onClose();
        }}
        className="block w-full border-t border-gray-200 py-2.5 text-center text-xs font-medium text-gold-600 hover:bg-gray-50"
      >
        View all notifications
      </button>
    </div>
  );
};

export default NotificationPanel;