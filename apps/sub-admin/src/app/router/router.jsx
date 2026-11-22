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
                path: "/reservations",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/ReservationsPage.jsx"),
                ),
              },
              {
                path: "/guests",
                lazy: lazyPage(
                  () => import("../../features/guests/pages/GuestsPage.jsx"),
                ),
              },
              {
                path: "/members",
                lazy: lazyPage(
                  () => import("../../features/members/pages/MembersPage.tsx"),
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
              // PMS Intelligence
              {
                path: "/intelligence/pms/revenue",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pms/pages/RevenuePage"),
                ),
              },
              {
                path: "/intelligence/pms/occupancy",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pms/pages/OccupancyPage"),
                ),
              },
              {
                path: "/intelligence/pms/adr",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pms/pages/AdrPage"),
                ),
              },
              {
                path: "/intelligence/pms/revpar",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pms/pages/RevparPage"),
                ),
              },
              {
                path: "/intelligence/pms/bookings",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pms/pages/BookingsPage"),
                ),
              },
              {
                path: "/intelligence/pms/guests",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pms/pages/GuestsPage"),
                ),
              },
              {
                path: "/intelligence/pms/cancellations",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pms/pages/CancellationsPage"),
                ),
              },
              {
                path: "/intelligence/pms/forecast",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pms/pages/ForecastPage"),
                ),
              },
              // POS Intelligence
              {
                path: "/intelligence/pos/sales",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pos/pages/SalesPage"),
                ),
              },
              {
                path: "/intelligence/pos/products",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pos/pages/ProductsPage"),
                ),
              },
              {
                path: "/intelligence/pos/customers",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pos/pages/CustomersPage"),
                ),
              },
              {
                path: "/intelligence/pos/orders",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pos/pages/OrdersPage"),
                ),
              },
              {
                path: "/intelligence/pos/upselling",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/pos/pages/UpsellingPage"),
                ),
              },
              {
                path: "/intelligence/pos/staff",
                lazy: lazyPage(
                  () => import("@/features/intelligence/pos/pages/StaffPage"),
                ),
              },
              // BI Intelligence
              {
                path: "/intelligence/bi/total-revenue",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/TotalRevenuePage"),
                ),
              },
              {
                path: "/intelligence/bi/pms-pos-revenue",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/PmsPosRevenuePage"),
                ),
              },
              {
                path: "/intelligence/bi/profitability",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/ProfitabilityPage"),
                ),
              },
              {
                path: "/intelligence/bi/conversion",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/ConversionPage"),
                ),
              },
              {
                path: "/intelligence/bi/guest-spending",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/GuestSpendingPage"),
                ),
              },
              {
                path: "/intelligence/bi/revenue-forecast",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/RevenueForecastPage"),
                ),
              },
              {
                path: "/intelligence/bi/clv",
                lazy: lazyPage(
                  () => import("@/features/intelligence/bi/pages/ClvPage"),
                ),
              },
              {
                path: "/intelligence/bi/recommendations",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/bi/pages/RecommendationsPage"),
                ),
              },
              // Reports
              {
                path: "/intelligence/reports",
                lazy: lazyPage(
                  () =>
                    import("@/features/intelligence/reports/pages/IntelligenceReportsPage"),
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
