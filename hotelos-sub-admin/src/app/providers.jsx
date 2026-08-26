import {
  createContext,
  useContext,
  useMemo,
} from "react";

import {
  clearAuth,
  getStoredUser,
} from "../services/auth.service.js";

const SubAdminContext =
  createContext(null);

export function SubAdminProvider({
  children,
}) {
  const user =
    useMemo(() => getStoredUser(), []);

  const value =
    useMemo(
      () => ({
        user,

        logout: () => {
          clearAuth();
        },
      }),

      [user]
    );

  return (
    <SubAdminContext.Provider
      value={value}
    >
      {children}
    </SubAdminContext.Provider>
  );
}

export function useSubAdmin() {
  const context =
    useContext(SubAdminContext);

  if (!context) {
    throw new Error(
      "useSubAdmin must be used within a SubAdminProvider"
    );
  }

  return context;
}
