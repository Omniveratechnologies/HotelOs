import { createContext, useContext } from "react";

export const SuperAdminContext = createContext(null);

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);

  if (!context) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  }

  return context;
}
