import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { getTables, regenerateTableQR } from "../../services/table.service.js";
import { extractErrorMessage } from "../../services/api.js";
import TableQRCard from "../../components/admin/TableQRCard.jsx";
import QRPreviewModal from "../../components/admin/QRPreviewModal.jsx";
import { CardGridSkeleton } from "../../components/common/Skeleton.jsx";

const QRManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewTable, setPreviewTable] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const fetchTables = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTables();
      setTables(result.data.tables);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleRegenerate = async (table) => {
    if (
      !window.confirm(
        `Regenerate QR for Table ${table.tableNumber}? The old QR will stop working.`,
      )
    )
      return;

    setRegeneratingId(table._id);
    try {
      await regenerateTableQR(table._id);
      await fetchTables();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">QR Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Each QR links directly to the customer menu for its table
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton count={8} image={false} />
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <QrCode size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No QR codes yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Add tables in the Tables module to generate their QR codes
            automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <TableQRCard
              key={table._id}
              table={table}
              onPreview={setPreviewTable}
              onRegenerate={handleRegenerate}
              regenerating={regeneratingId === table._id}
            />
          ))}
        </div>
      )}

      {previewTable && (
        <QRPreviewModal
          table={previewTable}
          onClose={() => setPreviewTable(null)}
        />
      )}
    </div>
  );
};

export default QRManagement;