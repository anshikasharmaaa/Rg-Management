import api from "./api.js";

export const adminLogin = async (email, password) => {
  const response = await api.post("/admin/login", { email, password });
  return response.data;
};

export const employeeLogin = async (mobile, password) => {
  const response = await api.post("/employee/login", { mobile, password });
  return response.data;
};
