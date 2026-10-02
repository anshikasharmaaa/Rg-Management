import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Utensils } from "lucide-react";
import {
  getTables,
  updateTableStatus,
  deleteTable as deleteTableService,
} from "../../services/table.service.js";
import { extractErrorMessage } from "../../services/api.js";
import AddTableModal from "../../components/admin/AddTableModal.jsx";
import EditTableModal from "../../components/admin/EditTableModal.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { CardGridSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import useNotice from "../../hooks/useNotice.js";

const STATUS_OPTIONS = ["AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"];
const TABLE_EVENTS = ["table_status_changed"];

const statusStyles = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  OCCUPIED: "bg-red-50 text-red-700 border-red-200",
  RESERVED: "bg-blue-50 text-blue-700 border-blue-200",
  OUT_OF_SERVICE: "bg-gray-100 text-gray-600 border-gray-200",
};

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const reqId = useRef(0);

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statusFilter || undefined,
    }),
    [debouncedSearch, statusFilter],
  );

  const fetchTables = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getTables(params);
        if (id !== reqId.current) return;
        setTables(result.data.tables);
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
    fetchTables();
  }, [fetchTables]);

  useLiveEvents(TABLE_EVENTS, () => fetchTables({ silent: true }));

  const runAction = async (table, action, message) => {
    setActionLoadingId(table._id);
    setError("");
    try {
      await action();
      setNotice(message);
      await fetchTables({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (table) => {
    if (!window.confirm(`Delete Table ${table.tableNumber}? This cannot be undone.`)) return;
    runAction(table, () => deleteTableService(table._id), `Table ${table.tableNumber} deleted`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tables</h1>
          <p className="mt-1 text-sm text-gray-500">Manage restaurant tables and their live status</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
        >
          <Plus size={16} />
          Add Table
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search table number..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 sm:w-52"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <AlertBanner message={error} />
      <AlertBanner type="success" message={notice} />

      {loading ? (
        <CardGridSkeleton count={8} image={false} />
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No tables found"
          message={
            params.search || params.status
              ? "No tables match your search or filter."
              : "Add your first table to start generating QR codes and taking orders."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div key={table._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Table</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{table.tableNumber}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[table.status]}`}>
                  {table.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Capacity: <span className="text-gray-700">{table.capacity} seats</span>
              </p>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-gray-500">Change Status</label>
                <select
                  value={table.status}
                  disabled={actionLoadingId === table._id}
                  onChange={(e) =>
                    runAction(
                      table,
                      () => updateTableStatus(table._id, e.target.value),
                      `Table ${table.tableNumber} is now ${e.target.value}`,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setEditingTable(table)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(table)}
                  disabled={actionLoadingId === table._id}
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
        <AddTableModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setNotice("Table added");
            fetchTables({ silent: true });
          }}
        />
      )}

      {editingTable && (
        <EditTableModal
          table={editingTable}
          onClose={() => setEditingTable(null)}
          onSuccess={() => {
            setEditingTable(null);
            setNotice("Table updated");
            fetchTables({ silent: true });
          }}
        />
      )}
    </div>
  );
};

export default Tables;