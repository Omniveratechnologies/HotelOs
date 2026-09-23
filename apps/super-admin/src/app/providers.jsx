import { AppProviders } from "./AppProviders.jsx";

export { AppProviders };

// Backward-compatible alias for any legacy imports
export function SuperAdminProvider({ children }) {
  return <AppProviders>{children}</AppProviders>;
}
