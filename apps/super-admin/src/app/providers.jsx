import { useMemo } from "react";

import { clearAuth, getStoredUser } from "../services/auth.service.js";

import { SuperAdminContext } from "./superAdminContext.js";

export function SuperAdminProvider({ children }) {
  const user = useMemo(() => getStoredUser(), []);

  const value = useMemo(
    () => ({
      user,

      logout: () => {
        clearAuth();
      },
    }),

    [user],
  );

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
}
