import { RefreshCw, Maximize2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { buildTableQrUrl } from "../../../../Backend/utils/qr";

const statusStyles = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  OCCUPIED: "bg-red-50 text-red-700 border-red-200",
  RESERVED: "bg-blue-50 text-blue-700 border-blue-200",
  OUT_OF_SERVICE: "bg-gray-100 text-gray-600 border-gray-200",
};

const TableQRCard = ({ table, onPreview, onRegenerate, regenerating }) => {
  const qrValue = buildTableQrUrl(table);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-gray-900">
          Table {table.tableNumber}
        </p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[table.status]}`}
        >
          {table.status}
        </span>
      </div>

      <div className="mt-4 flex justify-center rounded-lg border border-gray-100 bg-white p-3">
        <QRCodeCanvas value={qrValue} size={150} level="H" />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onPreview(table)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          <Maximize2 size={14} />
          View / Print
        </button>
        <button
          onClick={() => onRegenerate(table)}
          disabled={regenerating}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          title="Regenerate QR"
        >
          <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
};

export default TableQRCard;
