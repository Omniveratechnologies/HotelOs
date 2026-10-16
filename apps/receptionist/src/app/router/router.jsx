import { createBrowserRouter } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import PrintLayout from "../layouts/PrintLayout.jsx";
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
                path: "reservations",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/ReservationsPage.jsx"),
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
              {
                path: "billing/folio",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "folio" }),
              },
              {
                path: "billing/payments",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "payments" }),
              },
              {
                path: "billing/invoices",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "invoices" }),
              },
              {
                path: "billing/taxes-charges",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "taxes-charges" }),
              },
              {
                path: "billing/corporate",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "corporate" }),
              },
              {
                path: "billing/receivables",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "receivables" }),
              },
              {
                path: "billing/payables",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "payables" }),
              },
              {
                path: "billing/expenses",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "expenses" }),
              },
              {
                path: "billing/cashier",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "cashier" }),
              },
              {
                path: "billing/reconciliation",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "reconciliation" }),
              },
              {
                path: "billing/night-audit",
                lazy: lazyPage(
                  () => import("../../features/billing/pages/BillingRoute.jsx"),
                ),
                loader: () => ({ section: "night-audit" }),
              },
            ],
          },
        ],
      },
      {
        element: <PrintLayout />,
        children: [
          {
            path: "reports/print",
            lazy: lazyPage(
              () => import("../../features/reports/pages/ReportsPrintPage.jsx"),
            ),
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
