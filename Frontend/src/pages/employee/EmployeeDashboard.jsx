import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Clock, Flame, CheckCircle2, Wallet, Utensils, Bell } from "lucide-react";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";
import useNotifications from "../../hooks/useNotifications.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import StatCard from "../../components/admin/StatCard.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import SafeImage from "../../components/common/SafeImage.jsx";
import { Skeleton, StatGridSkeleton, CardGridSkeleton, ListSkeleton } from "../../components/common/Skeleton.jsx";
import { getOrders, getOrderStats } from "../../services/order.service.js";
import { getTables } from "../../services/table.service.js";
import { getPublicMenu, resolveMenuImage } from "../../services/menu.service.js";
import { extractErrorMessage } from "../../services/api.js";

const LIVE_EVENTS = ["new_order", "order_status_changed", "order_updated", "table_status_changed"];
const MENU_EVENTS = ["menu_item_created", "menu_item_updated", "menu_item_deleted"];

const statusStyles = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-orange-50 text-orange-700",
  READY: "bg-purple-50 text-purple-700",
  SERVED: "bg-teal-50 text-teal-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const EmployeeDashboard = () => {
  const { employee } = useEmployeeAuth();
  const { unreadCount } = useNotifications();

  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [tableCounts, setTableCounts] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, ordersRes, tablesRes] = await Promise.all([
        getOrderStats(),
        getOrders(),
        getTables(),
      ]);
      setStats(statsRes.data.stats);
      setRecentOrders(ordersRes.data.orders.slice(0, 5));

      const tables = tablesRes.data.tables;
      setTableCounts({
        available: tables.filter((t) => t.status === "AVAILABLE").length,
        occupied: tables.filter((t) => t.status === "OCCUPIED").length,
        reserved: tables.filter((t) => t.status === "RESERVED").length,
      });
      setError("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Same MongoDB-backed menu the Admin manages and the public site shows.
  const fetchMenu = useCallback(async () => {
    try {
      const result = await getPublicMenu();
      setMenuItems(result.data.menuItems || []);
    } catch {
      // secondary widget — fail quietly and keep the dashboard usable
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchMenu();
  }, [fetchAll, fetchMenu]);

  useLiveEvents(LIVE_EVENTS, () => fetchAll(), { employeeId: employee?.id });
  useLiveEvents(MENU_EVENTS, () => fetchMenu());

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <StatGridSkeleton count={5} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" />
        <StatGridSkeleton count={4} />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Welcome, {employee?.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening right now</p>
      </div>

      <AlertBanner message={error} />

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="My Total Orders" value={stats.totalOrders} icon={ClipboardList} accent />
          <StatCard label="Pending" value={stats.pendingOrders} icon={Clock} />
          <StatCard label="Preparing" value={stats.preparingOrders} icon={Flame} />
          <StatCard label="Completed" value={stats.completedOrders} icon={CheckCircle2} />
          <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toFixed(0)}`} icon={Wallet} />
        </div>
      )}

      {tableCounts && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Available Tables" value={tableCounts.available} icon={Utensils} />
          <StatCard label="Occupied Tables" value={tableCounts.occupied} icon={Utensils} />
          <StatCard label="Reserved Tables" value={tableCounts.reserved} icon={Utensils} />
          <StatCard label="Unread Notifications" value={unreadCount} icon={Bell} />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <p className="mb-4 text-sm font-semibold text-gray-900">Recent Orders</p>
        {recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No orders assigned to you yet</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.orderId}</p>
                  <p className="text-xs text-gray-500">
                    Table {order.tableNumber} · {order.customerName || "Guest"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gold-600">₹{order.totalAmount}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.orderStatus]}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read-only menu from the same /menu/public API the Home page uses. */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Today's Menu</p>
          <span className="text-xs text-gray-400">View only</span>
        </div>

        {menuLoading ? (
          <CardGridSkeleton
            count={6}
            image={false}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          />
        ) : menuItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No menu items available right now</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <div key={item._id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <SafeImage
                  src={resolveMenuImage(item.imageUrl)}
                  alt={item.name}
                  iconSize={18}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="truncate text-xs text-gray-500">{item.category?.name}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gold-600">₹{item.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;