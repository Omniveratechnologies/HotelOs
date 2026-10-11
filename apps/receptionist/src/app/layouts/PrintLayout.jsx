import { Outlet } from "react-router";
import { AppProviders } from "../providers/AppProviders.jsx";

export default function PrintLayout() {
  return (
    <AppProviders>
      <div className="min-h-screen bg-white">
        <Outlet />
      </div>
    </AppProviders>
  );
}
