import { X, Download, Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { buildTableQrUrl } from "../../../../Backend/utils/qr.js";

const QRPreviewModal = ({ table, onClose }) => {
  const qrValue = buildTableQrUrl(table);
  const canvasId = `qr-preview-canvas-${table._id}`;

  const handleDownload = () => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-${table.tableNumber}-qr.png`;
    link.click();
  };

  const handlePrint = () => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=420,height=560");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Table ${table.tableNumber} QR</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:24px;">
          <h2>Table ${table.tableNumber}</h2>
          <img src="${dataUrl}" style="width:280px;height:280px;" />
          <p>Scan to view menu</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-xl border border-charcoal-700 bg-charcoal-900 p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Table {table.tableNumber} QR
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center rounded-lg bg-white p-4">
          <QRCodeCanvas id={canvasId} value={qrValue} size={240} level="H" />
        </div>

        <p className="mt-3 break-all text-center text-xs text-gray-500">
          {qrValue}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-charcoal-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-charcoal-800"
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 hover:opacity-90"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPreviewModal;
