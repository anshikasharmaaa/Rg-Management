import { useState } from "react";
import { X } from "lucide-react";
import { updatePaymentStatus } from "../../services/payment.service.js";
import { extractErrorMessage } from "../../services/api.js";
import {
  getBranchLabel,
  getSlotLabel,
  PAYMENT_STATUSES,
} from "../../utils/branches.js";

const PaymentDetailsModal = ({ payment, isAdmin, onClose, onUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleStatusChange = async (status) => {
    setUpdating(true);
    setError("");
    try {
      await updatePaymentStatus(payment._id, status);
      onUpdated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {payment.paymentId}
            </h2>
            <p className="text-xs text-gray-500">
              {getBranchLabel(payment.branch)} · {getSlotLabel(payment.slot)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-gray-900">
                {new Date(payment.date).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-gray-900">{payment.status}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Sale</span>
              <span className="font-semibold text-gold-600">
                ₹{payment.totalSale}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-500">Online</span>
              <span className="text-gray-700">₹{payment.online}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-500">Cash</span>
              <span className="text-gray-700">₹{payment.cash}</span>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <p className="text-xs text-gray-500">Submitted By</p>
            <p className="text-gray-900">
              {payment.submittedByName} (
              {payment.submittedByRole === "ADMIN" ? "Admin" : "Employee"})
            </p>
          </div>

          {payment.notes && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-gray-700">{payment.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
            <p>Created: {new Date(payment.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(payment.updatedAt).toLocaleString()}</p>
          </div>

          {isAdmin && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Update Status
              </label>
              <select
                value={payment.status}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
