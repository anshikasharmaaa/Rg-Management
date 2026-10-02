import { useState } from "react";
import { X } from "lucide-react";
import { updateTable } from "../../services/table.service.js";
import { extractErrorMessage } from "../../services/api.js";

const EditTableModal = ({ table, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    status: table.status,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? value.replace(/[^0-9]/g, "") : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = "Table number is required";
    }

    if (!formData.capacity || Number(formData.capacity) < 1) {
      newErrors.capacity = "Capacity must be at least 1";
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
      await updateTable(table._id, {
        tableNumber: formData.tableNumber.trim(),
        capacity: Number(formData.capacity),
        status: formData.status,
      });
      onSuccess();
    } catch (error) {
      setServerError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Table</h2>
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Table Number
            </label>
            <input
              type="text"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            {errors.tableNumber && (
              <p className="mt-1 text-xs text-red-600">{errors.tableNumber}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Capacity (seats)
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="RESERVED">RESERVED</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
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
              {submitting ? "Saving..." : "Update Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTableModal;
