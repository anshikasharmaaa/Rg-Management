import axios from "axios";
import { ROUTES } from "../utils/routes.js";

const ADMIN_ONLY_PREFIXES = [
  "/admin",
  "/employees",
  "/categories",
  "/menu",
  "/dashboard",
  "/search",
  "/transfers",
  "/reports",
];
const SHARED_PREFIXES = ["/orders", "/notifications", "/payments", "/tables"];
const LOGIN_URLS = ["/admin/login", "/employee/login"];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const startsWithAny = (url, prefixes) =>
  prefixes.some((p) => url.startsWith(p));

// Shared endpoints (orders, tables...) use the token of the panel the user is
// currently in, so a leftover token from the other role is never sent.
const currentPanelRole = () => {
  const path = window.location.pathname;
  if (path.startsWith(ROUTES.ADMIN.ROOT)) return "admin";
  if (path.startsWith(ROUTES.EMPLOYEE.ROOT)) return "employee";
  return null;
};

api.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const tokens = {
      admin: localStorage.getItem("admin_token"),
      employee: localStorage.getItem("employee_token"),
    };

    let role = null;

    if (startsWithAny(url, ADMIN_ONLY_PREFIXES)) {
      if (tokens.admin) role = "admin";
    } else if (
      url.startsWith("/employee/") &&
      !url.startsWith("/employee/login")
    ) {
      if (tokens.employee) role = "employee";
    } else if (startsWithAny(url, SHARED_PREFIXES)) {
      const preferred = currentPanelRole();
      if (preferred && tokens[preferred]) role = preferred;
      else if (tokens.admin) role = "admin";
      else if (tokens.employee) role = "employee";
    }

    if (role) {
      config.headers.Authorization = `Bearer ${tokens[role]}`;
      config._authRole = role;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Expired / invalid token: clear that session and send the user to the right login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const role = error.config?._authRole;
    const url = error.config?.url || "";

    if (status === 401 && role && !LOGIN_URLS.some((u) => url.startsWith(u))) {
      localStorage.removeItem(`${role}_token`);
      localStorage.removeItem(`${role}_data`);
      const loginPath = role === "admin" ? ROUTES.ADMIN.LOGIN : ROUTES.LOGIN;
      if (window.location.pathname !== loginPath) {
        window.location.assign(loginPath);
      }
    }

    return Promise.reject(error);
  },
);

export const extractErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "The request took too long. Please check your connection and try again.";
  }
  if (error.request) {
    return "Unable to reach the server. Please check your network connection.";
  }
  return "Something went wrong. Please try again.";
};

export default api;
