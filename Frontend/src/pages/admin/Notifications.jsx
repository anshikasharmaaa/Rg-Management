import { Bell, Trash2, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications.js";
import { ListSkeleton } from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { ROUTES } from "../../utils/routes.js";

const A = ROUTES.ADMIN;

// Was "/admin/..." (no such route → 404). Now uses the real admin routes.
const ENTITY_ROUTES = {
  Order: A.ORDERS,
  MenuItem: A.MENU,
  Category: A.CATEGORIES,
  Employee: A.STAFF,
  Table: A.TABLES,
  Payment: A.PAYMENTS,
  BranchTransfer: A.PAYMENTS,
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();

  const handleClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    const route = ENTITY_ROUTES[notification.relatedEntityType];
    if (route) navigate(route);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification(s)` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          message="You'll see updates here as activity happens across RG Restaurant."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-card ${!notification.isRead ? "border-l-4 border-l-gold-500" : ""
                }`}
            >
              <button onClick={() => handleClick(notification)} className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </button>
              <button
                onClick={() => removeNotification(notification._id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;