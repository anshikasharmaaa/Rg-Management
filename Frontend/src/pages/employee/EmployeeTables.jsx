import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Utensils } from "lucide-react";
import { getTables, updateTableStatus } from "../../services/table.service.js";
import { extractErrorMessage } from "../../services/api.js";
import SearchInput from "../../components/common/SearchInput.jsx";
import AlertBanner from "../../components/common/AlertBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { CardGridSkeleton } from "../../components/common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useLiveEvents from "../../hooks/useLiveEvents.js";
import useNotice from "../../hooks/useNotice.js";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";

const STATUS_OPTIONS = ["AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"];
const TABLE_EVENTS = ["table_status_changed"];

const statusStyles = {
    AVAILABLE: "bg-green-50 text-green-700 border-green-200",
    OCCUPIED: "bg-red-50 text-red-700 border-red-200",
    RESERVED: "bg-blue-50 text-blue-700 border-blue-200",
    OUT_OF_SERVICE: "bg-gray-100 text-gray-600 border-gray-200",
};

const EmployeeTables = () => {
    const { employee } = useEmployeeAuth();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useNotice();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const reqId = useRef(0);

    const params = useMemo(
        () => ({ search: debouncedSearch.trim() || undefined, status: statusFilter || undefined }),
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

    useLiveEvents(TABLE_EVENTS, () => fetchTables({ silent: true }), { employeeId: employee?.id });

    const handleStatusChange = async (table, status) => {
        setActionLoadingId(table._id);
        setError("");
        try {
            await updateTableStatus(table._id, status);
            setNotice(`Table ${table.tableNumber} is now ${status}`);
            await fetchTables({ silent: true });
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Tables</h1>
                <p className="mt-1 text-sm text-gray-500">Live table status across the restaurant</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchInput value={search} onChange={setSearch} placeholder="Search table number..." />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 sm:w-52"
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
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
                            : "Ask an admin to add tables from the Admin Panel."
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
                                <label className="mb-1 block text-xs font-medium text-gray-500">Update Status</label>
                                <select
                                    value={table.status}
                                    disabled={actionLoadingId === table._id}
                                    onChange={(e) => handleStatusChange(table, e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeTables;