import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Wallet, Eye } from "lucide-react";
import { getPayments } from "../../services/payment.service.js";
import { extractErrorMessage } from "../../services/api.js";
import { getBranchLabel, getSlotLabel } from "../../utils/branches.js";
import AddPaymentModal from "../../components/admin/AddPaymentModal.jsx";
import PaymentDetailsModal from "../../components/admin/PaymentDetailsModal.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { CardGridSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import useNotice from "../../hooks/useNotice.js";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";

const PAYMENT_EVENTS = ["payment_received"];

const statusStyles = {
  SUBMITTED: "bg-yellow-50 text-yellow-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

const EmployeePayments = () => {
  const { employee } = useEmployeeAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const reqId = useRef(0);

  const params = useMemo(() => ({ search: debouncedSearch.trim() || undefined }), [debouncedSearch]);

  const fetchPayments = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getPayments(params);
        if (id !== reqId.current) return;
        setPayments(result.data.payments);
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
    fetchPayments();
  }, [fetchPayments]);

  useLiveEvents(PAYMENT_EVENTS, () => fetchPayments({ silent: true }), { employeeId: employee?.id });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Payment Entries</h1>
          <p className="mt-1 text-sm text-gray-500">Submit and track your sales entries</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      <div className="flex">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by payment ID, branch, notes..." />
      </div>

      <AlertBanner message={error} />
      <AlertBanner type="success" message={notice} />

      {loading ? (
        <CardGridSkeleton count={6} image={false} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={params.search ? "No entries found" : "No entries yet"}
          message={params.search ? "No entries match your search." : "Submit your first sales entry to get started."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{payment.paymentId}</p>
                  <p className="text-xs text-gray-500">
                    {getBranchLabel(payment.branch)} · {getSlotLabel(payment.slot)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[payment.status]}`}>
                  {payment.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
              <p className="mt-3 text-lg font-semibold text-gold-600">₹{payment.totalSale}</p>
              <p className="mt-1 text-xs text-gray-500">
                Online ₹{payment.online} · Cash ₹{payment.cash}
              </p>
              <button
                onClick={() => setSelectedPayment(payment)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <Eye size={14} />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPaymentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setNotice("Payment entry submitted");
            fetchPayments({ silent: true });
          }}
        />
      )}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          isAdmin={false}
          onClose={() => setSelectedPayment(null)}
          onUpdated={() => {
            setSelectedPayment(null);
            setNotice("Payment entry updated");
            fetchPayments({ silent: true });
          }}
        />
      )}
    </div>
  );
};

export default EmployeePayments;