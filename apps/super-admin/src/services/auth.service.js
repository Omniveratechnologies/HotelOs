import { loginAdmin, logoutAdmin } from "../api/client.js";

export const loginSuperAdmin = async (username, password) => {
  return loginAdmin(username, password);
};

export const logoutSuperAdmin = async () => {
  return logoutAdmin();
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
