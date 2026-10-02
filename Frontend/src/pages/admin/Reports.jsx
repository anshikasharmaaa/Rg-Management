import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  Wallet,
  ClipboardList,
  Users,
  Utensils,
} from "lucide-react";
import {
  getSalesReport,
  getOrdersReport,
  getEmployeeActivityReport,
  getTableActivityReport,
} from "../../services/report.service.js";
import { extractErrorMessage } from "../../services/api.js";
import { getBranchLabel } from "../../utils/branches.js";
import StatCard from "../../components/admin/StatCard.jsx";
import { TableSkeleton } from "../../components/common/Skeleton.jsx";

const todayStr = () => new Date().toISOString().slice(0, 10);

const dateRangeFor = (preset) => {
  const today = new Date();
  const start = new Date();

  if (preset === "today") return { startDate: todayStr(), endDate: todayStr() };
  if (preset === "week") {
    start.setDate(today.getDate() - today.getDay());
    return { startDate: start.toISOString().slice(0, 10), endDate: todayStr() };
  }
  if (preset === "month") {
    start.setDate(1);
    return { startDate: start.toISOString().slice(0, 10), endDate: todayStr() };
  }
  return { startDate: "", endDate: "" };
};

const TABS = [
  { key: "sales", label: "Sales Report", icon: Wallet },
  { key: "orders", label: "Order Report", icon: ClipboardList },
  { key: "employees", label: "Employee Activity", icon: Users },
  { key: "tables", label: "Table Activity", icon: Utensils },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [dates, setDates] = useState(dateRangeFor("month"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sales, setSales] = useState(null);
  const [orders, setOrders] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [tables, setTables] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = {
      startDate: dates.startDate || undefined,
      endDate: dates.endDate || undefined,
    };
    try {
      if (activeTab === "sales") {
        const res = await getSalesReport(params);
        setSales(res.data);
      } else if (activeTab === "orders") {
        const res = await getOrdersReport(params);
        setOrders(res.data);
      } else if (activeTab === "employees") {
        const res = await getEmployeeActivityReport(params);
        setEmployees(res.data);
      } else if (activeTab === "tables") {
        const res = await getTableActivityReport(params);
        setTables(res.data);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, dates]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sales, orders, staff and table activity — built from live data
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                ? "bg-gold-500 text-charcoal-950"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "month", label: "This Month" },
        ].map((preset) => (
          <button
            key={preset.key}
            onClick={() => setDates(dateRangeFor(preset.key))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            {preset.label}
          </button>
        ))}
        <input
          type="date"
          value={dates.startDate}
          onChange={(e) =>
            setDates((prev) => ({ ...prev, startDate: e.target.value }))
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={dates.endDate}
          onChange={(e) =>
            setDates((prev) => ({ ...prev, endDate: e.target.value }))
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <button
          onClick={() => setDates({ startDate: "", endDate: "" })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          All Time
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <>
          {activeTab === "sales" && sales && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Total Sale"
                  value={`₹${sales.totals.totalSale.toFixed(0)}`}
                  accent
                />
                <StatCard
                  label="Online"
                  value={`₹${sales.totals.online.toFixed(0)}`}
                />
                <StatCard
                  label="Cash"
                  value={`₹${sales.totals.cash.toFixed(0)}`}
                />
                <StatCard
                  label="Transfers"
                  value={`₹${sales.transfersTotal.toFixed(0)}`}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Branch-wise Sales
                </p>
                {sales.branchBreakdown.every((b) => b.totalSale === 0) ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No sales entries in this range
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                          <th className="py-2">Branch</th>
                          <th className="py-2">Total Sale</th>
                          <th className="py-2">Online</th>
                          <th className="py-2">Cash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.branchBreakdown.map((b) => (
                          <tr
                            key={b.branch}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-2 font-medium text-gray-900">
                              {b.label}
                            </td>
                            <td className="py-2 text-gold-600">
                              ₹{b.totalSale}
                            </td>
                            <td className="py-2 text-gray-600">₹{b.online}</td>
                            <td className="py-2 text-gray-600">₹{b.cash}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Daily Sales Breakdown
                </p>
                {sales.dailyBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No sales entries in this range
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                          <th className="py-2">Date</th>
                          <th className="py-2">Total Sale</th>
                          <th className="py-2">Online</th>
                          <th className="py-2">Cash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.dailyBreakdown.map((d) => (
                          <tr
                            key={d._id}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-2 text-gray-700">{d._id}</td>
                            <td className="py-2 text-gold-600">
                              ₹{d.totalSale}
                            </td>
                            <td className="py-2 text-gray-600">₹{d.online}</td>
                            <td className="py-2 text-gray-600">₹{d.cash}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "orders" && orders && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                  label="Total Orders"
                  value={orders.totals.totalOrders}
                  icon={ClipboardList}
                  accent
                />
                <StatCard
                  label="Total Revenue"
                  value={`₹${orders.totals.totalRevenue.toFixed(0)}`}
                />
                <StatCard
                  label="Avg Order Value"
                  value={`₹${orders.totals.averageOrderValue.toFixed(0)}`}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Top Tables by Orders
                </p>
                {orders.tableBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No orders in this range
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orders.tableBreakdown.map((t) => (
                      <div
                        key={t._id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700">Table {t._id}</span>
                        <span className="text-gray-600">
                          {t.orders} orders · ₹{t.revenue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Orders by Status
                </p>
                {orders.statusBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No orders in this range
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {orders.statusBreakdown.map((s) => (
                      <div
                        key={s._id}
                        className="rounded-lg bg-gray-50 px-3 py-2 text-center"
                      >
                        <p className="text-xs text-gray-500">{s._id}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {s.count}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "employees" && employees && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-card">
              {employees.activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                    <Users size={24} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    No employees found
                  </h2>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-5 py-3">Employee</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Orders Handled</th>
                        <th className="px-5 py-3">Order Revenue</th>
                        <th className="px-5 py-3">Sales Entries</th>
                        <th className="px-5 py-3">Entries Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.activity.map((emp) => (
                        <tr
                          key={emp.employeeId}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {emp.name}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${emp.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {emp.ordersHandled}
                          </td>
                          <td className="px-5 py-4 text-gold-600">
                            ₹{emp.ordersRevenue}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {emp.entriesSubmitted}
                          </td>
                          <td className="px-5 py-4 text-gold-600">
                            ₹{emp.entriesTotal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "tables" && tables && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Available"
                  value={tables.statusCounts.AVAILABLE}
                  icon={Utensils}
                />
                <StatCard
                  label="Occupied"
                  value={tables.statusCounts.OCCUPIED}
                  icon={Utensils}
                />
                <StatCard
                  label="Reserved"
                  value={tables.statusCounts.RESERVED}
                  icon={Utensils}
                />
                <StatCard
                  label="Out of Service"
                  value={tables.statusCounts.OUT_OF_SERVICE}
                  icon={Utensils}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-card">
                {tables.activity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                      <BarChart3 size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      No tables found
                    </h2>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                          <th className="px-5 py-3">Table</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Capacity</th>
                          <th className="px-5 py-3">Orders</th>
                          <th className="px-5 py-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tables.activity.map((t) => (
                          <tr
                            key={t.tableId}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-5 py-4 font-medium text-gray-900">
                              Table {t.tableNumber}
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              {t.status}
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              {t.capacity}
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              {t.orders}
                            </td>
                            <td className="px-5 py-4 text-gold-600">
                              ₹{t.revenue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;