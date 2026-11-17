import { AppProviders } from "./providers/AppProviders.jsx";

export { AppProviders };

export function KitchenOSProvider({ children }) {
  return <AppProviders>{children}</AppProviders>;
}
