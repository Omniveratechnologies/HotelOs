import { api } from "@hotelos/api";

export const loginSuperAdmin = async (username, password) => {
  const result = await api.post("/api/v1/auth/login", { username, password });

  if (!result.success) {
    throw new Error(result.message || "Login failed");
  }

  const { token, user } = result.data;

  if (user.role !== "SUPER_ADMIN") {
    throw new Error(
      "You are not authorized to access the Super Admin Dashboard",
    );
  }

  localStorage.setItem("auth_token", token);

  localStorage.setItem("auth_user", JSON.stringify(user));

  return result.data;
};

export const logoutSuperAdmin = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("auth_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("auth_token"));
};
