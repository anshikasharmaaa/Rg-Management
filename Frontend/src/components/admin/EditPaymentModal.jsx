import { useState } from "react";
import { X } from "lucide-react";
import { updatePayment } from "../../services/payment.service.js";
import { extractErrorMessage } from "../../services/api.js";
import { BRANCHES, SLOTS } from "../../utils/branches.js";

const EditPaymentModal = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    branch: payment.branch,
    date: new Date(payment.date).toISOString().slice(0, 10),
    slot: payment.slot,
    totalSale: payment.totalSale,
    online: payment.online,
    cash: payment.cash,
    notes: payment.notes || "",
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
    if (!formData.branch) newErrors.branch = "Select a branch";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.slot) newErrors.slot = "Select a slot";

    const total = Number(formData.totalSale);
    const online = Number(formData.online);
    const cash = Number(formData.cash);

    if (formData.totalSale === "" || Number.isNaN(total) || total < 0) {
      newErrors.totalSale = "Enter a valid total sale amount";
    }
    if (formData.online === "" || Number.isNaN(online) || online < 0) {
      newErrors.online = "Enter a valid online amount";
    }
    if (formData.cash === "" || Number.isNaN(cash) || cash < 0) {
      newErrors.cash = "Enter a valid cash amount";
    }

    if (!newErrors.totalSale && !newErrors.online && !newErrors.cash) {
      if (Math.abs(online + cash - total) > 0.01) {
        newErrors.cash = `Online + Cash (₹${(online + cash).toFixed(2)}) must equal Total Sale (₹${total.toFixed(2)})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await updatePayment(payment._id, {
        branch: formData.branch,
        date: formData.date,
        slot: formData.slot,
        totalSale: Number(formData.totalSale),
        online: Number(formData.online),
        cash: Number(formData.cash),
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
            Edit Payment Entry
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
                Branch
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              {errors.branch && (
                <p className="mt-1 text-xs text-red-600">{errors.branch}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Slot
              </label>
              <select
                name="slot"
                value={formData.slot}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                {SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {errors.slot && (
                <p className="mt-1 text-xs text-red-600">{errors.slot}</p>
              )}
            </div>
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
              Total Sale (₹)
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="totalSale"
              value={formData.totalSale}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            {errors.totalSale && (
              <p className="mt-1 text-xs text-red-600">{errors.totalSale}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Online (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="online"
                value={formData.online}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              {errors.online && (
                <p className="mt-1 text-xs text-red-600">{errors.online}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Cash (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="cash"
                value={formData.cash}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              {errors.cash && (
                <p className="mt-1 text-xs text-red-600">{errors.cash}</p>
              )}
            </div>
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
              {submitting ? "Saving..." : "Update Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPaymentModal;
