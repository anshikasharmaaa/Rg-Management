import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import {
  getEmployees,
  updateEmployeeStatus,
  deleteEmployee as deleteEmployeeService,
} from "../../services/employee.service.js";
import { extractErrorMessage } from "../../services/api.js";
import AddEmployeeModal from "../../components/admin/AddEmployeeModal.jsx";
import EditEmployeeModal from "../../components/admin/EditEmployeeModal.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import { TableRowsSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useNotice from "../../hooks/useNotice.js";

const StaffManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchEmployees = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await getEmployees();
      setEmployees(result.data.employees);
      setError("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // The employees API has no search param, so filter the fetched list
  // (debounced so typing stays smooth).
  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return employees.filter(
      (e) =>
        (!term || e.name.toLowerCase().includes(term) || e.mobile.includes(term)) &&
        (!statusFilter || e.status === statusFilter),
    );
  }, [employees, debouncedSearch, statusFilter]);

  const runAction = async (employee, action, message) => {
    setActionLoadingId(employee._id);
    setError("");
    try {
      await action();
      setNotice(message);
      await fetchEmployees({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = (employee) => {
    const next = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    runAction(employee, () => updateEmployeeStatus(employee._id, next), `${employee.name} is now ${next}`);
  };

  const handleDelete = (employee) => {
    if (!window.confirm(`Delete employee "${employee.name}"? This cannot be undone.`)) return;
    runAction(employee, () => deleteEmployeeService(employee._id), `${employee.name} deleted`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employees and their access</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
        >
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or mobile..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <AlertBanner message={error} />
      <AlertBanner type="success" message={notice} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Created Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton rows={6} cols={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    {employees.length === 0
                      ? 'No employees added yet. Click "Add Employee" to get started.'
                      : "No employees match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((employee) => (
                  <tr key={employee._id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{employee.name}</td>
                    <td className="px-5 py-4 text-gray-600">{employee.mobile}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${employee.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{employee.role}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          disabled={actionLoadingId === employee._id}
                          title={employee.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gold-700 disabled:opacity-50"
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          disabled={actionLoadingId === employee._id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setNotice("Employee added");
            fetchEmployees({ silent: true });
          }}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => {
            setEditingEmployee(null);
            setNotice("Employee updated");
            fetchEmployees({ silent: true });
          }}
        />
      )}
    </div>
  );
};

export default StaffManagement;