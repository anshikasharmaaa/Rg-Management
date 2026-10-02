import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import {
  getCategories,
  updateCategoryStatus,
  deleteCategory as deleteCategoryService,
} from "../../services/category.service.js";
import { extractErrorMessage } from "../../services/api.js";
import AddCategoryModal from "../../components/admin/AddCategoryModal.jsx";
import EditCategoryModal from "../../components/admin/EditCategoryModal.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { TableSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useNotice from "../../hooks/useNotice.js";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const reqId = useRef(0);

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statusFilter || undefined,
    }),
    [debouncedSearch, statusFilter],
  );

  const fetchCategories = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getCategories(params);
        if (id !== reqId.current) return;
        setCategories(result.data.categories);
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
    fetchCategories();
  }, [fetchCategories]);

  const runAction = async (category, action, message) => {
    setActionLoadingId(category._id);
    setError("");
    try {
      await action();
      setNotice(message);
      await fetchCategories({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (category) => {
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;
    runAction(category, () => deleteCategoryService(category._id), `"${category.name}" deleted`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Organize your menu into categories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories..." />
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

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={params.search || params.status ? "No categories found" : "No categories yet"}
          message={
            params.search || params.status
              ? "No categories match your search or filter."
              : "Add your first category to start organizing your menu."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{category.name}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-gray-600">
                      {category.description || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          runAction(
                            category,
                            () => updateCategoryStatus(category._id, !category.isActive),
                            `"${category.name}" ${category.isActive ? "deactivated" : "activated"}`,
                          )
                        }
                        disabled={actionLoadingId === category._id}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${category.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}
                      >
                        {category.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          disabled={actionLoadingId === category._id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setNotice("Category added");
            fetchCategories({ silent: true });
          }}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            setNotice("Category updated");
            fetchCategories({ silent: true });
          }}
        />
      )}
    </div>
  );
};

export default Categories;