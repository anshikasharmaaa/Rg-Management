import { useState } from "react";
import { X } from "lucide-react";
import { updateEmployee } from "../../services/employee.service.js";
import { extractErrorMessage } from "../../services/api.js";

const EditEmployeeModal = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: employee.name,
    mobile: employee.mobile,
    password: "",
    status: employee.status,
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

    if (!formData.name.trim()) newErrors.name = "Employee name is required";

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        status: formData.status,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      await updateEmployee(employee._id, payload);
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
          <h2 className="text-lg font-semibold text-gray-900">Edit Employee</h2>
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
              Employee Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Mobile Number
            </label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              maxLength={10}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            {errors.mobile && (
              <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              New Password (optional)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="Leave blank to keep current password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
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
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
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
              {submitting ? "Saving..." : "Update Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
