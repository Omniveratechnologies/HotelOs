import { Navigate, createBrowserRouter } from "react-router";

import AuthLayout from "./AuthLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
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
        path: "/login",
        lazy: lazyPage(() => import("../pages/auth/LoginPage.jsx")),
      },
      {
        path: "/reset-password",
        lazy: lazyPage(() => import("../pages/auth/ResetPasswordPage.jsx")),
      },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: "/",
                element: <Navigate to="/dashboard" replace />,
              },
              {
                path: "/dashboard",
                lazy: lazyPage(
                  () => import("../pages/dashboard/DashboardPage.jsx"),
                ),
              },
              {
                path: "/hotels",
                lazy: lazyPage(() => import("../pages/hotels/HotelsPage.jsx")),
              },
              {
                path: "/transactions",
                lazy: lazyPage(
                  () => import("../pages/transactions/TransactionsPage.jsx"),
                ),
              },
              {
                path: "/subscriptions",
                lazy: lazyPage(
                  () => import("../pages/subscriptions/SubscriptionsPage.jsx"),
                ),
              },
              {
                path: "/service-requests",
                lazy: lazyPage(
                  () =>
                    import("../pages/service-requests/ServiceRequestsPage.jsx"),
                ),
              },
              {
                path: "/channel-approvals",
                lazy: lazyPage(
                  () =>
                    import("../pages/channel-approvals/ChannelApprovalsPage.jsx"),
                ),
              },
              {
                path: "/channel-manager",
                lazy: lazyPage(
                  () =>
                    import("../pages/channel-manager/ChannelManagerPage.jsx"),
                ),
              },
              {
                path: "/settings",
                lazy: lazyPage(
                  () => import("../pages/settings/SettingsPage.jsx"),
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
