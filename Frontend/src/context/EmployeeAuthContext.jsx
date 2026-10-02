import { createContext, useState, useEffect } from "react";
import { employeeLogin as employeeLoginService } from "../services/auth.service.js";
import { extractErrorMessage } from "../services/api.js";

export const EmployeeAuthContext = createContext(null);

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("employee_token");
    const storedEmployee = localStorage.getItem("employee_data");

    if (storedToken && storedEmployee) {
      setToken(storedToken);
      setEmployee(JSON.parse(storedEmployee));
    }
    setInitializing(false);
  }, []);

  const login = async (mobile, password) => {
    try {
      const result = await employeeLoginService(mobile, password);
      const { token: newToken, employee: employeeData } = result.data;

      localStorage.setItem("employee_token", newToken);
      localStorage.setItem("employee_data", JSON.stringify(employeeData));

      setToken(newToken);
      setEmployee(employeeData);

      return { success: true };
    } catch (error) {
      return { success: false, message: extractErrorMessage(error) };
    }
  };

  const logout = () => {
    localStorage.removeItem("employee_token");
    localStorage.removeItem("employee_data");
    setToken(null);
    setEmployee(null);
  };

  const value = {
    employee,
    token,
    isAuthenticated: Boolean(token && employee),
    initializing,
    login,
    logout,
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};
