import api from "./api.js";

export const getOrders = async (params = {}) => {
  const response = await api.get("/orders", { params });
  return response.data;
};

export const getOrderStats = async () => {
  const response = await api.get("/orders/stats/summary");
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const addOrder = async (payload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export const updatePaymentStatus = async (id, paymentStatus) => {
  const response = await api.patch(`/orders/${id}/payment-status`, {
    paymentStatus,
  });
  return response.data;
};

export const assignEmployeeToOrder = async (id, employeeId) => {
  const response = await api.patch(`/orders/${id}/assign`, { employeeId });
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
};
