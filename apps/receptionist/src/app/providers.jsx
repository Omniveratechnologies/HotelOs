import { AppProviders } from "./providers/AppProviders.jsx";

export { AppProviders };

// Backward-compatible alias for any legacy imports
export function HotelOSProvider({ children }) {
  return <AppProviders>{children}</AppProviders>;
}
