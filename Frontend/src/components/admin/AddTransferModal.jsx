import { useState } from "react";
import { X } from "lucide-react";
import { addTransfer } from "../../services/transfer.service.js";
import { extractErrorMessage } from "../../services/api.js";
import { BRANCHES } from "../../utils/branches.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

const AddTransferModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fromBranch: "",
    toBranch: "",
    amount: "",
    date: todayStr(),
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fromBranch) newErrors.fromBranch = "Select source branch";
    if (!formData.toBranch) newErrors.toBranch = "Select destination branch";
    if (
      formData.fromBranch &&
      formData.toBranch &&
      formData.fromBranch === formData.toBranch
    ) {
      newErrors.toBranch = "Source and destination must be different";
    }
    const amount = Number(formData.amount);
    if (formData.amount === "" || Number.isNaN(amount) || amount <= 0) {
      newErrors.amount = "Enter a valid amount greater than 0";
    }
    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await addTransfer({
        fromBranch: formData.fromBranch,
        toBranch: formData.toBranch,
        amount: Number(formData.amount),
        date: formData.date,
        notes: formData.notes.trim(),
      });
      onSuccess();
    } catch (error) {
      setServerError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Branch Transfer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                From Branch
              </label>
              <select
                name="fromBranch"
                value={formData.fromBranch}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">Select</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              {errors.fromBranch && (
                <p className="mt-1 text-xs text-red-600">{errors.fromBranch}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                To Branch
              </label>
              <select
                name="toBranch"
                value={formData.toBranch}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">Select</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              {errors.toBranch && (
                <p className="mt-1 text-xs text-red-600">{errors.toBranch}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Amount (₹)
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="5000"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransferModal;
