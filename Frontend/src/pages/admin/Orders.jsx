import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, ClipboardList, Eye } from "lucide-react";
import { getOrders, getOrderStats } from "../../services/order.service.js";
import { getTables } from "../../services/table.service.js";
import { getEmployees } from "../../services/employee.service.js";
import { extractErrorMessage } from "../../services/api.js";
import AddOrderModal from "../../components/admin/AddOrderModal.jsx";
import OrderDetailsModal from "../../components/admin/OrderDetailsModal.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { StatGridSkeleton, TableSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import useNotice from "../../hooks/useNotice.js";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];
const PAYMENT_METHODS = ["CASH", "ONLINE"];
const LIVE_EVENTS = ["new_order", "order_status_changed", "order_updated", "payment_received"];

const statusStyles = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-orange-50 text-orange-700",
  READY: "bg-purple-50 text-purple-700",
  SERVED: "bg-teal-50 text-teal-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const selectClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500";

const FilterSelect = ({ value, onChange, placeholder, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const toOptions = (list) => list.map((v) => ({ value: v, label: v }));

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [tables, setTables] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState({
    date: "", status: "", paymentStatus: "", paymentMethod: "", table: "", employee: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const reqId = useRef(0);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      date: filters.date || undefined,
      status: filters.status || undefined,
      paymentStatus: filters.paymentStatus || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      table: filters.table || undefined,
      employee: filters.employee || undefined,
    }),
    [debouncedSearch, filters],
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

  const fetchStats = useCallback(async () => {
    try {
      const result = await getOrderStats();
      setStats(result.data.stats);
    } catch {
      // stats are secondary; the orders list still works
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
    getTables().then((res) => setTables(res.data.tables)).catch(() => setTables([]));
    getEmployees().then((res) => setEmployees(res.data.employees)).catch(() => setEmployees([]));
  }, [fetchStats]);

  useLiveEvents(LIVE_EVENTS, () => {
    fetchOrders({ silent: true });
    fetchStats();
  });

  const refreshAll = () => {
    fetchOrders({ silent: true });
    fetchStats();
  };

  const hasFilters = Object.values(params).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage all restaurant orders</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {statsLoading ? (
        <StatGridSkeleton count={8} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" />
      ) : (
        stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Pending" value={stats.pendingOrders} />
            <StatCard label="Preparing" value={stats.preparingOrders} />
            <StatCard label="Completed" value={stats.completedOrders} />
            <StatCard label="Cancelled" value={stats.cancelledOrders} />
            <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toFixed(0)}`} accent />
            <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toFixed(0)}`} accent />
            <StatCard label="Avg Order Value" value={`₹${stats.averageOrderValue.toFixed(0)}`} />
          </div>
        )
      )}

      <div className="space-y-3">
        <div className="flex">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order ID, customer, mobile, table..."
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilter("date", e.target.value)}
            className={selectClass}
          />
          <FilterSelect value={filters.status} onChange={(v) => setFilter("status", v)} placeholder="All Statuses" options={toOptions(ORDER_STATUSES)} />
          <FilterSelect value={filters.paymentStatus} onChange={(v) => setFilter("paymentStatus", v)} placeholder="All Payment Status" options={toOptions(PAYMENT_STATUSES)} />
          <FilterSelect value={filters.paymentMethod} onChange={(v) => setFilter("paymentMethod", v)} placeholder="All Payment Methods" options={toOptions(PAYMENT_METHODS)} />
          <FilterSelect value={filters.table} onChange={(v) => setFilter("table", v)} placeholder="All Tables" options={tables.map((t) => ({ value: t._id, label: `Table ${t.tableNumber}` }))} />
          <FilterSelect value={filters.employee} onChange={(v) => setFilter("employee", v)} placeholder="All Employees" options={employees.map((e) => ({ value: e._id, label: e.name }))} />
        </div>
      </div>

      <AlertBanner message={error} />
      <AlertBanner type="success" message={notice} />

      {loading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          message={hasFilters ? "No orders match your search or filters." : "Orders will appear here once customers start placing them."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Table</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Handled By</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-5 py-4 text-gray-600">{order.tableNumber}</td>
                    <td className="px-5 py-4 text-gray-600">{order.customerName || "Guest"}</td>
                    <td className="px-5 py-4 text-gold-600">₹{order.totalAmount}</td>
                    <td className="px-5 py-4 text-gray-600">{order.paymentMethod} · {order.paymentStatus}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.orderStatus]}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{order.assignedEmployee?.name || "Unassigned"}</td>
                    <td className="px-5 py-4 text-gray-600">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddOrderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setNotice("Order created");
            refreshAll();
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => {
            setSelectedOrder(null);
            setNotice("Order updated");
            refreshAll();
          }}
        />
      )}
    </div>
  );
};

export default Orders;