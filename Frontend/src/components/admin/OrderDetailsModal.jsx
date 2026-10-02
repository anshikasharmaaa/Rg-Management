import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  updateOrderStatus,
  updatePaymentStatus,
  assignEmployeeToOrder,
} from "../../services/order.service.js";
import { getEmployees } from "../../services/employee.service.js";
import { extractErrorMessage } from "../../services/api.js";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];

const OrderDetailsModal = ({ order, onClose, onUpdated }) => {
  const [employees, setEmployees] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getEmployees()
      .then((res) =>
        setEmployees(res.data.employees.filter((e) => e.status === "ACTIVE")),
      )
      .catch(() => setEmployees([]));
  }, []);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    setError("");
    try {
      await updateOrderStatus(order._id, status);
      onUpdated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (paymentStatus) => {
    setUpdating(true);
    setError("");
    try {
      await updatePaymentStatus(order._id, paymentStatus);
      onUpdated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (employeeId) => {
    setUpdating(true);
    setError("");
    try {
      await assignEmployeeToOrder(order._id, employeeId || null);
      onUpdated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Order {order.orderId}
            </h2>
            <p className="text-xs text-gray-500">Table {order.tableNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {(order.customerName || order.customerMobile) && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <p className="text-gray-700">{order.customerName || "Guest"}</p>
              {order.customerMobile && (
                <p className="text-xs text-gray-500">{order.customerMobile}</p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Items</p>
            <div className="space-y-1.5 rounded-lg border border-gray-200 p-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-gray-700">₹{item.subtotal}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gold-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Order Status
            </label>
            <select
              value={order.orderStatus}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Payment Method
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {order.paymentMethod}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Payment Status
              </label>
              <select
                value={order.paymentStatus}
                disabled={updating}
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Handled By
            </label>
            <select
              value={order.assignedEmployee?._id || ""}
              disabled={updating}
              onChange={(e) => handleAssign(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
