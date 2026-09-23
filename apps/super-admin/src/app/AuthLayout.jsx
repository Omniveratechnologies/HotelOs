import { Navigate, Outlet, useLocation } from "react-router";

import { clearAuth, getStoredUser, isAuthenticated } from "@hotelos/api";

export default function AuthLayout() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getStoredUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    clearAuth();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
