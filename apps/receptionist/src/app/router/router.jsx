import { createBrowserRouter } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import AuthLayout from "../AuthLayout.jsx";
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
        path: "login",
        lazy: lazyPage(() => import("../../features/auth/pages/LoginPage.jsx")),
      },
      {
        path: "accept-invitation",
        lazy: lazyPage(
          () => import("../../features/auth/pages/AcceptInvitationPage.jsx"),
        ),
      },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                index: true,
                lazy: lazyPage(
                  () =>
                    import("../../features/dashboard/pages/DashboardPage.jsx"),
                ),
              },
              {
                path: "rooms",
                lazy: lazyPage(
                  () => import("../../features/rooms/pages/RoomsPage.jsx"),
                ),
              },
              {
                path: "guests",
                lazy: lazyPage(
                  () => import("../../features/guests/pages/GuestsPage.jsx"),
                ),
              },
              {
                path: "food",
                lazy: lazyPage(
                  () =>
                    import("../../features/food-orders/pages/FoodOrdersPage.jsx"),
                ),
              },
              {
                path: "housekeeping",
                lazy: lazyPage(
                  () =>
                    import("../../features/housekeeping/pages/HousekeepingPage.jsx"),
                ),
              },
              {
                path: "reports",
                lazy: lazyPage(
                  () => import("../../features/reports/pages/ReportsPage.jsx"),
                ),
              },
              {
                path: "rate-plans",
                lazy: lazyPage(
                  () =>
                    import("../../features/rate-plans/pages/RatePlansPage.jsx"),
                ),
              },
              {
                path: "room-types",
                lazy: lazyPage(
                  () =>
                    import("../../features/room-types/pages/RoomTypesPage.jsx"),
                ),
              },
              {
                path: "settings",
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
