export const buildTableQrUrl = (table) => {
  const baseUrl = import.meta.env.VITE_CUSTOMER_URL || window.location.origin;
  return `${baseUrl}/menu?table=${encodeURIComponent(table.tableNumber)}&code=${encodeURIComponent(table.qrCode)}`;
};
