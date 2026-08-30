import { createBrowserRouter } from "react-router-dom";

import AuthLayout from "./AuthLayout.jsx";
import HotelLayout from "../layouts/HotelLayout.jsx";
import ErrorScreen from "./ErrorScreen.jsx";

export function lazyPage(importer) {
  return async () => {
    const { default: Component } = await importer();

    return {
      Component,
    };
  };
}

export const router = createBrowserRouter([
  {
    errorElement: <ErrorScreen />,
    children: [
      {
        path: "/",
        lazy: lazyPage(() => import("../pages/landing/LandingPage.jsx")),
      },
      {
        path: "/login",
        lazy: lazyPage(() => import("../pages/auth/LoginPage.jsx")),
      },
      {
        path: "/accept-invitation",
        lazy: lazyPage(() => import("../pages/auth/AcceptInvitationPage.jsx")),
      },
      {
        path: "/reset-password",
        lazy: lazyPage(() => import("../pages/auth/ResetPasswordPage.jsx")),
      },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <HotelLayout />,
            children: [
              {
                path: "/dashboard",
                lazy: lazyPage(
                  () => import("../pages/dashboard/DashboardPage.jsx"),
                ),
              },
              {
                path: "/members",
                lazy: lazyPage(
                  () => import("../pages/dashboard/MembersPage.jsx"),
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
