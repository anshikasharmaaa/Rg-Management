import api from "./api.js";

export const getCategories = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};

export const addCategory = async (payload) => {
  const response = await api.post("/categories", payload);
  return response.data;
};

export const updateCategory = async (id, payload) => {
  const response = await api.put(`/categories/${id}`, payload);
  return response.data;
};

export const updateCategoryStatus = async (id, isActive) => {
  const response = await api.patch(`/categories/${id}/status`, { isActive });
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};
