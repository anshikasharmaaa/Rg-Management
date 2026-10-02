import { createContext, useState, useEffect } from "react";
import { adminLogin as adminLoginService } from "../services/auth.service.js";
import { extractErrorMessage } from "../services/api.js";

export const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    const storedAdmin = localStorage.getItem("admin_data");

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setInitializing(false);
  }, []);

  const login = async (email, password) => {
    try {
      const result = await adminLoginService(email, password);
      const { token: newToken, admin: adminData } = result.data;

      localStorage.setItem("admin_token", newToken);
      localStorage.setItem("admin_data", JSON.stringify(adminData));

      setToken(newToken);
      setAdmin(adminData);

      return { success: true };
    } catch (error) {
      return { success: false, message: extractErrorMessage(error) };
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    setToken(null);
    setAdmin(null);
  };

  const value = {
    admin,
    token,
    isAuthenticated: Boolean(token && admin),
    initializing,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
