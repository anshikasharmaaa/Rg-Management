import { useContext } from "react";
import { EmployeeAuthContext } from "../context/EmployeeAuthContext.jsx";

const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error(
      "useEmployeeAuth must be used within an EmployeeAuthProvider",
    );
  }
  return context;
};

export default useEmployeeAuth;
