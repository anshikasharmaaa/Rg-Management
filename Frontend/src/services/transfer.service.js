import api from "./api.js";

export const getTransfers = async (params = {}) => {
  const response = await api.get("/transfers", { params });
  return response.data;
};

export const addTransfer = async (payload) => {
  const response = await api.post("/transfers", payload);
  return response.data;
};

export const updateTransfer = async (id, payload) => {
  const response = await api.put(`/transfers/${id}`, payload);
  return response.data;
};

export const deleteTransfer = async (id) => {
  const response = await api.delete(`/transfers/${id}`);
  return response.data;
};
