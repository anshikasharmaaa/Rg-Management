import api from "./api.js";

export const getEmployees = async () => {
  const response = await api.get("/employees");
  return response.data;
};

export const addEmployee = async (payload) => {
  const response = await api.post("/employees", payload);
  return response.data;
};

export const updateEmployee = async (id, payload) => {
  const response = await api.put(`/employees/${id}`, payload);
  return response.data;
};

export const updateEmployeeStatus = async (id, status) => {
  const response = await api.patch(`/employees/${id}/status`, { status });
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};
