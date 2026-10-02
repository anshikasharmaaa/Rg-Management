import api from "./api.js";

export const getPayments = async (params = {}) => {
  const response = await api.get("/payments", { params });
  return response.data;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const getPaymentSummary = async (params = {}) => {
  const response = await api.get("/payments/summary", { params });
  return response.data;
};

export const getBranchFinancialSummary = async (params = {}) => {
  const response = await api.get("/payments/branch-financial-summary", {
    params,
  });
  return response.data;
};

export const addPayment = async (payload) => {
  const response = await api.post("/payments", payload);
  return response.data;
};

export const updatePayment = async (id, payload) => {
  const response = await api.put(`/payments/${id}`, payload);
  return response.data;
};

export const updatePaymentStatus = async (id, status) => {
  const response = await api.patch(`/payments/${id}/status`, { status });
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};
