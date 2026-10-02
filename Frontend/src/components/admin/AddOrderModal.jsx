import { useState, useEffect } from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { addOrder } from "../../services/order.service.js";
import { getMenuItems } from "../../services/menu.service.js";
import { getTables } from "../../services/table.service.js";
import { extractErrorMessage } from "../../services/api.js";

const AddOrderModal = ({ onClose, onSuccess }) => {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cart, setCart] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    getTables()
      .then((res) => setTables(res.data.tables))
      .catch(() => setTables([]));
    getMenuItems({ isActive: "true", isAvailable: "true" })
      .then((res) => setMenuItems(res.data.menuItems))
      .catch(() => setMenuItems([]));
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item._id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItemId === menuItemId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const validate = () => {
    const newErrors = {};
    if (!tableId) newErrors.table = "Select a table";
    if (cart.length === 0) newErrors.cart = "Add at least one item";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await addOrder({
        tableId,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        paymentMethod,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
        })),
      });
      onSuccess();
    } catch (error) {
      setServerError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Table
              </label>
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">Select table</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.tableNumber}
                  </option>
                ))}
              </select>
              {errors.table && (
                <p className="mt-1 text-xs text-red-600">{errors.table}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Customer Name (optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Mobile (optional)
              </label>
              <input
                type="text"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500 sm:w-48"
            >
              <option value="CASH">CASH</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Menu Items</p>
            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-2 sm:grid-cols-3">
              {menuItems.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => addToCart(item)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs hover:border-gold-400"
                >
                  <p className="truncate font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-gold-600">₹{item.price}</p>
                </button>
              ))}
            </div>
            {errors.cart && (
              <p className="mt-1 text-xs text-red-600">{errors.cart}</p>
            )}
          </div>

          {cart.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Order Summary
              </p>
              <div className="space-y-2">
                {cart.map((c) => (
                  <div
                    key={c.menuItemId}
                    className="flex items-center justify-between text-sm"
                  >
                    <p className="text-gray-700">{c.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(c.menuItemId, -1)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-gray-900">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(c.menuItemId, 1)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="w-14 text-right text-gold-600">
                        ₹{c.price * c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.menuItemId)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                <span className="text-gray-700">Total</span>
                <span className="text-gold-600">₹{total}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
