import api from "./api.js";

export const globalSearch = async (query) => {
  const response = await api.get("/search", { params: { q: query } });
  return response.data;
};
