import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  isAuthenticated,
  getStoredUser,
  clearAuth,
} from "@/features/auth/services/auth.service.js";

export default function AuthLayout() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getStoredUser();
  if (user?.role !== "KITCHEN") {
    clearAuth();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
