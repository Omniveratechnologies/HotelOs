import { createBrowserRouter } from "react-router";

import AuthLayout from "../AuthLayout.jsx";
import HotelLayout from "../layouts/HotelLayout.jsx";
import { ErrorScreen } from "@hotelos/ui/ErrorScreen";
import { LoadingScreen } from "@hotelos/ui/components/LoadingScreen";

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
    HydrateFallback: LoadingScreen,
    children: [
      {
        path: "/",
        lazy: lazyPage(
          () => import("../../features/landing/pages/LandingPage.jsx"),
        ),
      },
      {
        path: "/login",
        lazy: lazyPage(() => import("../../features/auth/pages/LoginPage.jsx")),
      },
      {
        path: "/accept-invitation",
        lazy: lazyPage(
          () => import("../../features/auth/pages/AcceptInvitationPage.jsx"),
        ),
      },
      {
        path: "/reset-password",
        lazy: lazyPage(
          () => import("../../features/auth/pages/ResetPasswordPage.jsx"),
        ),
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
                  () =>
                    import("../../features/dashboard/pages/DashboardPage.jsx"),
                ),
              },
              {
                path: "/members",
                lazy: lazyPage(
                  () => import("../../features/members/pages/MembersPage.jsx"),
                ),
              },
              {
                path: "/rooms",
                lazy: lazyPage(
                  () => import("../../features/rooms/pages/RoomsPage.jsx"),
                ),
              },
              {
                path: "/rate-plans",
                lazy: lazyPage(
                  () =>
                    import("../../features/rate-plans/pages/RatePlansPage.jsx"),
                ),
              },
              {
                path: "/room-types",
                lazy: lazyPage(
                  () =>
                    import("../../features/room-types/pages/RoomTypesPage.jsx"),
                ),
              },
              {
                path: "/settings",
                lazy: lazyPage(
                  () =>
                    import("../../features/settings/pages/SettingsPage.jsx"),
                ),
              },
            ],
          },
        ],
      },
      {
        path: "*",
        lazy: async () => {
          const { NotFound } = await import("@hotelos/ui/pages/NotFound");

          return { Component: NotFound };
        },
      },
    ],
  },
]);
