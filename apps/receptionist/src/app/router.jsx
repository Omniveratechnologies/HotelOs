import { createBrowserRouter } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import AuthLayout from "./AuthLayout.jsx";
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
        path: "login",
        lazy: lazyPage(() => import("../pages/auth/LoginPage.jsx")),
      },
      {
        path: "accept-invitation",
        lazy: lazyPage(() => import("../pages/auth/AcceptInvitationPage.jsx")),
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
                  () => import("../pages/dashboard/DashboardPage.jsx"),
                ),
              },
              {
                path: "rooms",
                lazy: lazyPage(() => import("../pages/rooms/RoomsPage.jsx")),
              },
              {
                path: "guests",
                lazy: lazyPage(() => import("../pages/guests/GuestsPage.jsx")),
              },
              {
                path: "food",
                lazy: lazyPage(
                  () => import("../pages/food-orders/FoodOrdersPage.jsx"),
                ),
              },
              {
                path: "housekeeping",
                lazy: lazyPage(
                  () => import("../pages/housekeeping/HousekeepingPage.jsx"),
                ),
              },
              {
                path: "reports",
                lazy: lazyPage(
                  () => import("../pages/reports/ReportsPage.jsx"),
                ),
              },
              {
                path: "settings",
                lazy: lazyPage(
                  () => import("../pages/settings/SettingsPage.jsx"),
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
