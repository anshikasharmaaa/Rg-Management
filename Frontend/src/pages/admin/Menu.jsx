import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import {
  getMenuItems,
  updateMenuItemStatus,
  updateMenuItemAvailability,
  deleteMenuItem as deleteMenuItemService,
  resolveMenuImage,
} from "../../services/menu.service.js";
import { getCategories } from "../../services/category.service.js";
import { extractErrorMessage } from "../../services/api.js";
import AddMenuItemModal from "../../components/admin/AddMenuItemModal.jsx";
import EditMenuItemModal from "../../components/admin/EditMenuItemModal.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import SafeImage from "../../components/common/SafeImage.jsx";
import { CardGridSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import useNotice from "../../hooks/useNotice.js";

const TYPE_LABEL = { VEG: "Veg", NON_VEG: "Non-Veg", EGG: "Egg" };
const MENU_EVENTS = ["menu_item_created", "menu_item_updated", "menu_item_deleted"];
const selectClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const reqId = useRef(0);

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      category: categoryFilter || undefined,
      isActive: statusFilter || undefined,
      isAvailable: availabilityFilter || undefined,
    }),
    [debouncedSearch, categoryFilter, statusFilter, availabilityFilter],
  );

  const fetchMenuItems = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getMenuItems(params);
        if (id !== reqId.current) return;
        setMenuItems(result.data.menuItems);
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
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    getCategories()
      .then((result) => setCategories(result.data.categories))
      .catch(() => setCategories([]));
  }, []);

  useLiveEvents(MENU_EVENTS, () => fetchMenuItems({ silent: true }));

  const runAction = async (item, action, message) => {
    setActionLoadingId(item._id);
    setError("");
    try {
      await action();
      setNotice(message);
      await fetchMenuItems({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    runAction(item, () => deleteMenuItemService(item._id), `"${item.name}" deleted`);
  };

  const hasFilters = Boolean(params.search || params.category || params.isActive || params.isAvailable);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Menu Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Changes here appear instantly on the Home page, Menu page and Employee dashboard
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search menu items..." />
        <div className="grid grid-cols-3 gap-2 lg:flex">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className={selectClass}>
            <option value="">All Availability</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      <AlertBanner message={error} />
      <AlertBanner type="success" message={notice} />

      {loading ? (
        <CardGridSkeleton count={8} />
      ) : menuItems.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No menu items found"
          message={hasFilters ? "No items match your search or filters." : "Add your first menu item to start building your menu."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => (
            <div key={item._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <SafeImage
                src={resolveMenuImage(item.imageUrl)}
                alt={item.name}
                iconSize={28}
                className="mb-3 h-32 w-full rounded-lg object-cover"
              />

              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="shrink-0 font-semibold text-gold-600">₹{item.price}</p>
              </div>

              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                {item.description || "No description"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {item.category?.name || "—"} · {TYPE_LABEL[item.type] || "Veg"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    runAction(
                      item,
                      () => updateMenuItemStatus(item._id, !item.isActive),
                      `"${item.name}" ${item.isActive ? "deactivated" : "activated"}`,
                    )
                  }
                  disabled={actionLoadingId === item._id}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${item.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                >
                  {item.isActive ? "ACTIVE" : "INACTIVE"}
                </button>
                <button
                  onClick={() =>
                    runAction(
                      item,
                      () => updateMenuItemAvailability(item._id, !item.isAvailable),
                      `"${item.name}" marked ${item.isAvailable ? "unavailable" : "available"}`,
                    )
                  }
                  disabled={actionLoadingId === item._id}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${item.isAvailable ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {item.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setEditingItem(item)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={actionLoadingId === item._id}
                  className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMenuItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setNotice("Menu item added");
            fetchMenuItems({ silent: true });
          }}
        />
      )}

      {editingItem && (
        <EditMenuItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            setNotice("Menu item updated");
            fetchMenuItems({ silent: true });
          }}
        />
      )}
    </div>
  );
};

export default Menu;