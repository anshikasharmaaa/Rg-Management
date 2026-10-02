import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Wallet,
  Eye,
  Pencil,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import {
  getPayments,
  getPaymentSummary,
  getBranchFinancialSummary,
  deletePayment as deletePaymentService,
} from "../../services/payment.service.js";
import {
  getTransfers,
  deleteTransfer as deleteTransferService,
} from "../../services/transfer.service.js";
import { getEmployees } from "../../services/employee.service.js";
import { extractErrorMessage } from "../../services/api.js";
import {
  BRANCHES,
  SLOTS,
  PAYMENT_STATUSES,
  getBranchLabel,
  getSlotLabel,
} from "../../utils/branches.js";
import AddPaymentModal from "../../components/admin/AddPaymentModal.jsx";
import EditPaymentModal from "../../components/admin/EditPaymentModal.jsx";
import PaymentDetailsModal from "../../components/admin/PaymentDetailsModal.jsx";
import AddTransferModal from "../../components/admin/AddTransferModal.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import { TableSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import { getSocket } from "../../utils/socket.js";

const statusStyles = {
  SUBMITTED: "bg-yellow-50 text-yellow-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const dateRangeFor = (preset) => {
  const today = new Date();
  const start = new Date();
  const end = new Date();

  if (preset === "today") {
    return { startDate: todayStr(), endDate: todayStr() };
  }
  if (preset === "yesterday") {
    start.setDate(today.getDate() - 1);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: start.toISOString().slice(0, 10),
    };
  }
  if (preset === "week") {
    start.setDate(today.getDate() - today.getDay());
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }
  if (preset === "month") {
    start.setDate(1);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }
  return { startDate: "", endDate: "" };
};

const Payments = () => {
  const [activeTab, setActiveTab] = useState("history");

  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState({
    branch: "",
    slot: "",
    status: "",
    employee: "",
    startDate: "",
    endDate: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [summaryDates, setSummaryDates] = useState({
    startDate: todayStr(),
    endDate: todayStr(),
  });
  const [summaryData, setSummaryData] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [transfers, setTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [transferFilters, setTransferFilters] = useState({
    fromBranch: "",
    toBranch: "",
    startDate: "",
    endDate: "",
  });
  const [showAddTransferModal, setShowAddTransferModal] = useState(false);

  const fetchPayments = useCallback(async (params) => {
    setLoadingPayments(true);
    setError("");
    try {
      const result = await getPayments(params);
      setPayments(result.data.payments);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const buildPaymentParams = useCallback(
    () => ({
      search: debouncedSearch.trim() || undefined,
      branch: filters.branch || undefined,
      slot: filters.slot || undefined,
      status: filters.status || undefined,
      employee: filters.employee || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    fetchPayments(buildPaymentParams());
  }, [buildPaymentParams, fetchPayments]);

  useEffect(() => {
    getEmployees()
      .then((res) => setEmployees(res.data.employees))
      .catch(() => setEmployees([]));

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const refreshPayments = () => fetchPayments(buildPaymentParams());
    const refreshTransfers = () => fetchTransfers();

    socket.on("payment_received", refreshPayments);
    socket.on("branch_transfer_created", refreshTransfers);

    return () => {
      socket.off("payment_received", refreshPayments);
      socket.off("branch_transfer_created", refreshTransfers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const [summaryResult, financialResult] = await Promise.all([
        getPaymentSummary(summaryDates),
        getBranchFinancialSummary(summaryDates),
      ]);
      setSummaryData(summaryResult.data.summary);
      setFinancialSummary(financialResult.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingSummary(false);
    }
  }, [summaryDates]);

  useEffect(() => {
    if (activeTab === "summary") fetchSummary();
  }, [activeTab, fetchSummary]);

  const fetchTransfers = useCallback(
    async (params = transferFilters) => {
      setLoadingTransfers(true);
      try {
        const result = await getTransfers({
          fromBranch: params.fromBranch || undefined,
          toBranch: params.toBranch || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
        });
        setTransfers(result.data.transfers);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoadingTransfers(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [transferFilters],
  );

  useEffect(() => {
    if (activeTab === "transfers") fetchTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDeletePayment = async (payment) => {
    if (
      !window.confirm(
        `Delete payment entry ${payment.paymentId}? This cannot be undone.`,
      )
    )
      return;
    setActionLoadingId(payment._id);
    try {
      await deletePaymentService(payment._id);
      await fetchPayments(buildPaymentParams());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTransfer = async (transfer) => {
    if (
      !window.confirm(
        `Delete transfer ${transfer.transferId}? This cannot be undone.`,
      )
    )
      return;
    try {
      await deleteTransferService(transfer._id);
      await fetchTransfers();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const totals = payments.reduce(
    (acc, p) => ({
      totalSale: acc.totalSale + p.totalSale,
      online: acc.online + p.online,
      cash: acc.cash + p.cash,
    }),
    { totalSale: 0, online: 0, cash: 0 },
  );

  const branchSummaries = BRANCHES.map((branch) => {
    const slotRows = SLOTS.map((slot) => {
      const found = summaryData.find(
        (s) => s._id.branch === branch.value && s._id.slot === slot.value,
      );
      return {
        slot: slot.label,
        totalSale: found?.totalSale || 0,
        online: found?.online || 0,
        cash: found?.cash || 0,
      };
    });
    const total = slotRows.reduce(
      (acc, r) => ({
        totalSale: acc.totalSale + r.totalSale,
        online: acc.online + r.online,
        cash: acc.cash + r.cash,
      }),
      { totalSale: 0, online: 0, cash: 0 },
    );
    return { branch: branch.label, slotRows, total };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Payments & Sales
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track daily sales, branch performance and transfers
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
        {[
          { key: "history", label: "Payment History" },
          { key: "summary", label: "Branch Summary" },
          { key: "transfers", label: "Branch Transfers" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                ? "bg-gold-500 text-charcoal-950"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="grid grid-cols-3 gap-3 sm:flex">
              <StatCard
                label="Total Sale"
                value={`₹${totals.totalSale.toFixed(0)}`}
                accent
              />
              <StatCard label="Online" value={`₹${totals.online.toFixed(0)}`} />
              <StatCard label="Cash" value={`₹${totals.cash.toFixed(0)}`} />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
            >
              <Plus size={16} />
              Add Payment
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by payment ID, employee, branch..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "week", label: "This Week" },
                { key: "month", label: "This Month" },
              ].map((preset) => (
                <button
                  key={preset.key}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      ...dateRangeFor(preset.key),
                    }))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: "",
                    endDate: "",
                  }))
                }
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                All Time
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <select
                value={filters.branch}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, branch: e.target.value }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All Branches</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.slot}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, slot: e.target.value }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All Slots</option>
                {SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All Status</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={filters.employee}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, employee: e.target.value }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingPayments ? (
            <TableSkeleton rows={6} cols={6} />
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                <Wallet size={24} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                No payment entries found
              </h2>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Add your first sales entry to start tracking payments.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Branch</th>
                        <th className="px-5 py-3">Slot</th>
                        <th className="px-5 py-3">Total Sale</th>
                        <th className="px-5 py-3">Online</th>
                        <th className="px-5 py-3">Cash</th>
                        <th className="px-5 py-3">Submitted By</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr
                          key={p._id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-5 py-4 text-gray-600">
                            {new Date(p.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {getBranchLabel(p.branch)}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {getSlotLabel(p.slot)}
                          </td>
                          <td className="px-5 py-4 text-gold-600">
                            ₹{p.totalSale}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            ₹{p.online}
                          </td>
                          <td className="px-5 py-4 text-gray-600">₹{p.cash}</td>
                          <td className="px-5 py-4 text-gray-600">
                            {p.submittedByName}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {p.submittedByRole === "ADMIN"
                              ? "Admin"
                              : "Employee"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[p.status]}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedPayment(p)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                title="View"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => setEditingPayment(p)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(p)}
                                disabled={actionLoadingId === p._id}
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getBranchLabel(p.branch)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getSlotLabel(p.slot)} ·{" "}
                          {new Date(p.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-gold-600">
                      ₹{p.totalSale}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Online ₹{p.online} · Cash ₹{p.cash}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {p.submittedByName} (
                      {p.submittedByRole === "ADMIN" ? "Admin" : "Employee"})
                    </p>
                    <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setEditingPayment(p)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(p)}
                        disabled={actionLoadingId === p._id}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={summaryDates.startDate}
              onChange={(e) =>
                setSummaryDates((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={summaryDates.endDate}
              onChange={(e) =>
                setSummaryDates((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            <button
              onClick={() =>
                setSummaryDates({ startDate: todayStr(), endDate: todayStr() })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Today
            </button>
          </div>

          {loadingSummary ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {branchSummaries.map((b) => (
                  <div
                    key={b.branch}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-card"
                  >
                    <p className="mb-4 text-sm font-semibold text-gray-900">
                      {b.branch}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-gray-500">
                            <th className="pb-2">Slot</th>
                            <th className="pb-2">Total Sale</th>
                            <th className="pb-2">Online</th>
                            <th className="pb-2">Cash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.slotRows.map((row) => (
                            <tr
                              key={row.slot}
                              className="border-t border-gray-100"
                            >
                              <td className="py-2 text-gray-700">{row.slot}</td>
                              <td className="py-2 text-gold-600">
                                ₹{row.totalSale}
                              </td>
                              <td className="py-2 text-gray-600">
                                ₹{row.online}
                              </td>
                              <td className="py-2 text-gray-600">
                                ₹{row.cash}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-gray-200 font-semibold">
                            <td className="py-2 text-gray-900">Total</td>
                            <td className="py-2 text-gold-600">
                              ₹{b.total.totalSale}
                            </td>
                            <td className="py-2 text-gray-700">
                              ₹{b.total.online}
                            </td>
                            <td className="py-2 text-gray-700">
                              ₹{b.total.cash}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {financialSummary && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
                  <p className="mb-4 text-sm font-semibold text-gray-900">
                    Branch Financial Summary
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard
                      label="Overall Sales"
                      value={`₹${financialSummary.overall.totalSale.toFixed(0)}`}
                      accent
                    />
                    <StatCard
                      label="Overall Online"
                      value={`₹${financialSummary.overall.online.toFixed(0)}`}
                    />
                    <StatCard
                      label="Overall Cash"
                      value={`₹${financialSummary.overall.cash.toFixed(0)}`}
                    />
                    <StatCard
                      label="Total Transfers"
                      value={`₹${financialSummary.overall.totalTransfers.toFixed(0)}`}
                    />
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                          <th className="py-2">Branch</th>
                          <th className="py-2">Sales</th>
                          <th className="py-2">Online</th>
                          <th className="py-2">Cash</th>
                          <th className="py-2">Transfers Out</th>
                          <th className="py-2">Transfers In</th>
                          <th className="py-2">Net Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialSummary.branches.map((b) => (
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
                            <td className="py-2 text-red-600">
                              ₹{b.transfersOut}
                            </td>
                            <td className="py-2 text-green-600">
                              ₹{b.transfersIn}
                            </td>
                            <td className="py-2 font-medium text-gray-900">
                              ₹{b.netPosition}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Net Position = Sales + Transfers In − Transfers Out
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "transfers" && (
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <select
                value={transferFilters.fromBranch}
                onChange={(e) => {
                  const next = {
                    ...transferFilters,
                    fromBranch: e.target.value,
                  };
                  setTransferFilters(next);
                  fetchTransfers(next);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All From</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <select
                value={transferFilters.toBranch}
                onChange={(e) => {
                  const next = { ...transferFilters, toBranch: e.target.value };
                  setTransferFilters(next);
                  fetchTransfers(next);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All To</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={transferFilters.startDate}
                onChange={(e) => {
                  const next = {
                    ...transferFilters,
                    startDate: e.target.value,
                  };
                  setTransferFilters(next);
                  fetchTransfers(next);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <input
                type="date"
                value={transferFilters.endDate}
                onChange={(e) => {
                  const next = { ...transferFilters, endDate: e.target.value };
                  setTransferFilters(next);
                  fetchTransfers(next);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <button
              onClick={() => setShowAddTransferModal(true)}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
            >
              <Plus size={16} />
              Add Transfer
            </button>
          </div>

          {loadingTransfers ? (
            <TableSkeleton rows={6} cols={6} />
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                <ArrowRightLeft size={24} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                No transfers recorded
              </h2>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Record a branch transfer to track money moved between branches.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">From</th>
                      <th className="px-5 py-3">To</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Created By</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr
                        key={t._id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-gray-900">
                          {getBranchLabel(t.fromBranch)}
                        </td>
                        <td className="px-5 py-4 text-gray-900">
                          {getBranchLabel(t.toBranch)}
                        </td>
                        <td className="px-5 py-4 text-gold-600">₹{t.amount}</td>
                        <td className="px-5 py-4 text-gray-600">
                          {t.createdByName}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteTransfer(t)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddPaymentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPayments(buildPaymentParams());
          }}
        />
      )}

      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => {
            setEditingPayment(null);
            fetchPayments(buildPaymentParams());
          }}
        />
      )}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          isAdmin
          onClose={() => setSelectedPayment(null)}
          onUpdated={() => {
            fetchPayments(buildPaymentParams());
            setSelectedPayment(null);
          }}
        />
      )}

      {showAddTransferModal && (
        <AddTransferModal
          onClose={() => setShowAddTransferModal(false)}
          onSuccess={() => {
            setShowAddTransferModal(false);
            fetchTransfers();
          }}
        />
      )}
    </div>
  );
};

export default Payments;