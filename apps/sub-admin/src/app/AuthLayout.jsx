import { Navigate, Outlet, useLocation } from "react-router";

import { isAuthenticated } from "@hotelos/api";

export default function AuthLayout() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
