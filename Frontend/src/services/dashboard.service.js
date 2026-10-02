import api from "./api.js";

export const getDashboardOverview = async () => {
  const response = await api.get("/dashboard/overview");
  return response.data;
};

export const getDashboardCharts = async () => {
  const response = await api.get("/dashboard/charts");
  return response.data;
};
