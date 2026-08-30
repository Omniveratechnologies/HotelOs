import { createContext, useContext } from "react";

export const SubAdminContext = createContext(null);

export function useSubAdmin() {
  const context = useContext(SubAdminContext);

  if (!context) {
    throw new Error("useSubAdmin must be used within a SubAdminProvider");
  }

  return context;
}
