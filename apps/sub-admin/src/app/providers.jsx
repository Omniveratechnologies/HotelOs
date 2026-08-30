import { useMemo } from "react";

import { clearAuth, getStoredUser } from "../services/auth.service.js";

import { SubAdminContext } from "./subAdminContext.js";

export function SubAdminProvider({ children }) {
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
    <SubAdminContext.Provider value={value}>
      {children}
    </SubAdminContext.Provider>
  );
}
