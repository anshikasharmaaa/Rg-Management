import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { ClipboardList, Eye } from "lucide-react";
import { getOrders } from "../../services/order.service.js";
import { extractErrorMessage } from "../../services/api.js";
import OrderDetailsModal from "../../components/admin/OrderDetailsModal.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { CardGridSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import useNotice from "../../hooks/useNotice.js";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";

const LIVE_EVENTS = ["new_order", "order_status_changed", "order_updated"];
const STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];

const statusStyles = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-orange-50 text-orange-700",
  READY: "bg-purple-50 text-purple-700",
  SERVED: "bg-teal-50 text-teal-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const EmployeeOrders = () => {
  const { employee } = useEmployeeAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const reqId = useRef(0);

  const params = useMemo(
    () => ({ search: debouncedSearch.trim() || undefined, status: statusFilter || undefined }),
    [debouncedSearch, statusFilter],
  );

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getOrders(params);
        if (id !== reqId.current) return;
        setOrders(result.data.orders);
        setError("");
      } catch (err) {
        if (id === reqId.current) setError(extractErrorMessage(err));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [params],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useLiveEvents(LIVE_EVENTS, () => fetchOrders({ silent: true }), { employeeId: employee?.id });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Orders assigned to you</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by order ID, customer, table..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 sm:w-48"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <AlertBanner message={error} />
      <AlertBanner type="success" message={notice} />

      {loading ? (
        <CardGridSkeleton count={6} image={false} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          message={
            params.search || params.status
              ? "No orders match your search or filter."
              : "Orders assigned to you by the admin will appear here."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{order.orderId}</p>
                  <p className="text-xs text-gray-500">Table {order.tableNumber}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.orderStatus]}`}>
                  {order.orderStatus}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{order.customerName || "Guest"}</p>
              <p className="mt-1 text-sm font-semibold text-gold-600">₹{order.totalAmount}</p>
              <button
                onClick={() => setSelectedOrder(order)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <Eye size={14} />
                View / Update
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => {
            setSelectedOrder(null);
            setNotice("Order updated");
            fetchOrders({ silent: true });
          }}
        />
      )}
    </div>
  );
};

export default EmployeeOrders;