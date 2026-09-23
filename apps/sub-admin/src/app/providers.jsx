import { AppProviders } from "./providers/AppProviders.jsx";

export { AppProviders };

export function SubAdminProvider({ children }) {
  return <AppProviders>{children}</AppProviders>;
}
