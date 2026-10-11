import { Navigate, createBrowserRouter } from "react-router";

import AuthLayout from "./AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
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
        lazy: lazyPage(() => import("../features/auth/pages/LoginPage.jsx")),
      },
      {
        path: "/reset-password",
        lazy: lazyPage(
          () => import("../features/auth/pages/ResetPasswordPage.jsx"),
        ),
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
                  () => import("../features/dashboard/pages/DashboardPage.jsx"),
                ),
              },
              {
                path: "/hotels",
                lazy: lazyPage(
                  () => import("../features/hotels/pages/HotelsPage.jsx"),
                ),
              },
              {
                path: "/transactions",
                lazy: lazyPage(
                  () =>
                    import("../features/transactions/pages/TransactionsPage.jsx"),
                ),
              },
              {
                path: "/subscriptions",
                lazy: lazyPage(
                  () =>
                    import("../features/subscriptions/pages/SubscriptionsPage.jsx"),
                ),
              },
              {
                path: "/service-requests",
                lazy: lazyPage(
                  () =>
                    import("../features/service-requests/pages/ServiceRequestsPage.jsx"),
                ),
              },
              {
                path: "/channel-approvals",
                lazy: lazyPage(
                  () =>
                    import("../features/channel-approvals/pages/ChannelApprovalsPage.jsx"),
                ),
              },
              {
                path: "/channel-manager",
                lazy: lazyPage(
                  () =>
                    import("../features/channel-manager/pages/ChannelManagerPage.jsx"),
                ),
              },
              {
                path: "/settings",
                lazy: lazyPage(
                  () => import("../features/settings/pages/SettingsPage.jsx"),
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

export default router;
