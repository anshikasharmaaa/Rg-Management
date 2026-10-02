import api from "./api.js";

export const getSalesReport = async (params = {}) => {
  const response = await api.get("/reports/sales", { params });
  return response.data;
};

export const getOrdersReport = async (params = {}) => {
  const response = await api.get("/reports/orders", { params });
  return response.data;
};

export const getEmployeeActivityReport = async (params = {}) => {
  const response = await api.get("/reports/employees", { params });
  return response.data;
};

export const getTableActivityReport = async (params = {}) => {
  const response = await api.get("/reports/tables", { params });
  return response.data;
};
