import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList, Clock, Flame, CheckCircle2, XCircle, Wallet, Banknote, Globe,
  Utensils, BookOpen, ListOrdered, CalendarClock, Tags, Users, Sunrise, Sunset,
  ArrowRightLeft,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import StatCard from "../../components/admin/StatCard.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import { Skeleton, StatGridSkeleton, ChartSkeleton } from "../../components/common/Skeleton.jsx";
import { getDashboardOverview, getDashboardCharts } from "../../services/dashboard.service.js";
import { extractErrorMessage } from "../../services/api.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";

const LIVE_EVENTS = ["new_order", "order_status_changed", "payment_received", "table_status_changed", "branch_transfer_created"];

const STATUS_COLORS = {
  PENDING: "#eab308", CONFIRMED: "#0ea5e9", PREPARING: "#f97316", READY: "#8b5cf6",
  SERVED: "#14b8a6", COMPLETED: "#22c55e", CANCELLED: "#ef4444",
};
const PAYMENT_COLORS = { CASH: "#b8912a", ONLINE: "#0ea5e9" };
const SLOT_COLORS = { MORNING: "#eab308", EVENING: "#6366f1" };

const tooltipStyle = { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 };
const tooltipItemStyle = { color: "#1f2937" };
const tooltipLabelStyle = { color: "#1f2937", fontWeight: 600 };
const legendStyle = { fontSize: 11, color: "#4b5563" };

const inr = (n) => `₹${Number(n || 0).toFixed(0)}`;

const Section = ({ title, gridClass, children }) => (
  <div>
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
    <div className={`grid gap-4 ${gridClass}`}>{children}</div>
  </div>
);

const ChartCard = ({ title, className = "", children }) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-card ${className}`}>
    <p className="mb-4 text-sm font-semibold text-gray-900">{title}</p>
    {children}
  </div>
);

const ChartTooltip = () => (
  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
);

const DonutCard = ({ title, data = [], dataKey, colors }) => (
  <ChartCard title={title}>
    {data.length === 0 ? (
      <p className="py-24 text-center text-sm text-gray-500">No data yet</p>
    ) : (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={dataKey} nameKey="_id" innerRadius={50} outerRadius={80}>
              {data.map((entry) => (
                <Cell key={entry._id} fill={colors[entry._id] || "#9ca3af"} />
              ))}
            </Pie>
            <Legend wrapperStyle={legendStyle} />
            <ChartTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )}
  </ChartCard>
);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [overviewResult, chartsResult] = await Promise.all([
        getDashboardOverview(),
        getDashboardCharts(),
      ]);
      setOverview(overviewResult.data);
      setCharts(chartsResult.data);
      setError("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live updates, throttled so a burst of orders doesn't fire a burst of requests.
  useLiveEvents(LIVE_EVENTS, () => fetchAll());

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <StatGridSkeleton count={6} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" />
        <StatGridSkeleton count={7} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" />
        <ChartSkeleton count={4} />
      </div>
    );
  }

  const o = overview;

  const salesStats = o
    ? [
      { label: "Today's Total Sales", value: inr(o.todayTotalSales), icon: Wallet, accent: true },
      { label: "Today's Online Sales", value: inr(o.todayOnlineSales), icon: Globe },
      { label: "Today's Cash Sales", value: inr(o.todayCashSales), icon: Banknote },
      { label: "Morning Sales", value: inr(o.todayMorningSales), icon: Sunrise },
      { label: "Evening Sales", value: inr(o.todayEveningSales), icon: Sunset },
      { label: "Total Transfers", value: inr(o.totalTransfersAmount), icon: ArrowRightLeft },
    ]
    : [];

  const branchStats = (o?.branchSales || []).map((b) => ({
    label: `${b.label} Sales (Today)`,
    value: inr(b.totalSale),
    icon: Wallet,
  }));

  const orderStats = o
    ? [
      { label: "Total Orders", value: o.totalOrders, icon: ListOrdered },
      { label: "Today's Orders", value: o.todayOrders, icon: CalendarClock },
      { label: "Pending Orders", value: o.pendingOrders, icon: Clock },
      { label: "Preparing Orders", value: o.preparingOrders, icon: Flame },
      { label: "Ready Orders", value: o.readyOrders, icon: ClipboardList },
      { label: "Completed Orders", value: o.completedOrders, icon: CheckCircle2 },
      { label: "Cancelled Orders", value: o.cancelledOrders, icon: XCircle },
    ]
    : [];

  const revenueStats = o
    ? [
      { label: "Today's Order Revenue", value: inr(o.todayRevenue), icon: Wallet, accent: true },
      { label: "Total Order Revenue", value: inr(o.totalRevenue), icon: Banknote },
      { label: "Avg Order Value", value: inr(o.averageOrderValue), icon: Globe },
    ]
    : [];

  const otherStats = o
    ? [
      { label: "Available Tables", value: o.availableTables, icon: Utensils },
      { label: "Occupied Tables", value: o.occupiedTables, icon: Utensils },
      { label: "Total Menu Items", value: o.totalMenuItems, icon: BookOpen },
      { label: "Active Menu Items", value: o.activeMenuItems, icon: BookOpen },
      { label: "Total Categories", value: o.totalCategories, icon: Tags },
      { label: "Active Categories", value: o.activeCategories, icon: Tags },
      { label: "Total Employees", value: o.totalEmployees, icon: Users },
      { label: "Active Employees", value: o.activeEmployees, icon: Users },
    ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">A snapshot of RG Restaurant's performance</p>
      </div>

      <AlertBanner message={error} />

      {o && (
        <>
          <Section title="Sales (Today)" gridClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {salesStats.map((s) => <StatCard key={s.label} {...s} />)}
          </Section>

          {branchStats.length > 0 && (
            <Section title="Branch Sales (Today)" gridClass="grid-cols-1 sm:grid-cols-2">
              {branchStats.map((s) => <StatCard key={s.label} {...s} />)}
            </Section>
          )}

          <Section title="Orders" gridClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {orderStats.map((s) => <StatCard key={s.label} {...s} />)}
          </Section>

          <Section title="Order Revenue" gridClass="grid-cols-1 sm:grid-cols-3">
            {revenueStats.map((s) => <StatCard key={s.label} {...s} />)}
          </Section>

          <Section title="Tables, Menu & Staff" gridClass="grid-cols-2 sm:grid-cols-4">
            {otherStats.map((s) => <StatCard key={s.label} {...s} />)}
          </Section>
        </>
      )}

      {charts && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Analytics</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Orders — Last 7 Days">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.ordersOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="_id" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="orders" stroke="#b8912a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Sales Trend — Last 7 Days">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="_id" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="totalSale" name="Total Sale" stroke="#b8912a" strokeWidth={2} />
                    <Line type="monotone" dataKey="online" name="Online" stroke="#0ea5e9" strokeWidth={2} />
                    <Line type="monotone" dataKey="cash" name="Cash" stroke="#22c55e" strokeWidth={2} />
                    <Legend wrapperStyle={legendStyle} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Branch Comparison — Last 7 Days">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.branchComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <ChartTooltip />
                    <Bar dataKey="totalSale" fill="#b8912a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <DonutCard title="Morning vs Evening — Last 7 Days" data={charts.slotComparison} dataKey="totalSale" colors={SLOT_COLORS} />
            <DonutCard title="Orders by Status" data={charts.statusDistribution} dataKey="count" colors={STATUS_COLORS} />
            <DonutCard title="Order Payments — Cash vs Online" data={charts.paymentMethodDistribution} dataKey="count" colors={PAYMENT_COLORS} />

            <ChartCard title="Popular Menu Items" className="lg:col-span-2">
              {charts.popularItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No order data yet</p>
              ) : (
                <div className="space-y-3">
                  {charts.popularItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{item._id}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-gold-500"
                            style={{
                              width: `${Math.min(100, (item.quantity / charts.popularItems[0].quantity) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-gray-500">{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title="Employee Order Workload" className="lg:col-span-2">
              {charts.employeeWorkload.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No assigned orders yet</p>
              ) : (
                <div className="space-y-3">
                  {charts.employeeWorkload.map((emp) => (
                    <div key={emp.employeeId} className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{emp.name}</p>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                        {emp.orders} orders
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;