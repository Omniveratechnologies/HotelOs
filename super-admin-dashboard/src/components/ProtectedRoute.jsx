import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(
    localStorage.getItem("auth_user") || "null"
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "SUPER_ADMIN") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}