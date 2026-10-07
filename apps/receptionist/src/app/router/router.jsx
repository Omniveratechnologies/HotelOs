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
                path: "reservations/new",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/NewReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/:id/edit",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/NewReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/phone/new",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/PhoneReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/phone/:id/edit",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/PhoneReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/website/new",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/NewReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/website/:id/edit",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/NewReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/corporate/new",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/CorporateReservationPage.jsx"),
                ),
              },
              {
                path: "reservations/corporate/:id/edit",
                lazy: lazyPage(
                  () =>
                    import("../../features/reservations/pages/CorporateReservationPage.jsx"),
                ),
              },
              {
                path: "check-in/:token",
                lazy: lazyPage(
                  () =>
                    import("../../features/check-in/pages/SelfCheckInPage.jsx"),
                ),
              },
              {
                path: "front-desk/check-in",
                lazy: lazyPage(
                  () =>
                    import("../../features/check-in/pages/DigitalCheckInDashboardPage.jsx"),
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
                path: "dev/ui-scratch",
                lazy: lazyPage(
                  () => import("../../features/dev/UiScratchPage.jsx"),
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
