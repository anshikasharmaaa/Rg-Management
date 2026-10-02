import api from "./api.js";

export const getTables = async (params = {}) => {
  const response = await api.get("/tables", { params });
  return response.data;
};

export const getTableById = async (id) => {
  const response = await api.get(`/tables/${id}`);
  return response.data;
};

export const addTable = async (payload) => {
  const response = await api.post("/tables", payload);
  return response.data;
};

export const updateTable = async (id, payload) => {
  const response = await api.put(`/tables/${id}`, payload);
  return response.data;
};

export const updateTableStatus = async (id, status) => {
  const response = await api.patch(`/tables/${id}/status`, { status });
  return response.data;
};

export const regenerateTableQR = async (id) => {
  const response = await api.patch(`/tables/${id}/regenerate-qr`);
  return response.data;
};

export const deleteTable = async (id) => {
  const response = await api.delete(`/tables/${id}`);
  return response.data;
};
