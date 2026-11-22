// oxlint-disable react/only-export-components
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Info } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { DashboardHeader } from "@/components/guest-dashboard/DashboardHeader";
import { ErrorBanner } from "@/components/guest-dashboard/ErrorBanner";
import { ServicesGrid } from "@/components/guest-dashboard/ServicesGrid";
import { OrdersList } from "@/components/guest-dashboard/OrdersList";
import { OrderFoodModal } from "@/components/guest-dashboard/OrderFoodModal";
import { OrderAmenitiesModal } from "@/components/guest-dashboard/OrderAmenitiesModal";
import { WifiCard } from "@/components/guest-dashboard/WifiCard";
import { useAuth } from "@/context/useAuth";
import { useGuestDashboard } from "@/context/useGuestDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guest Dashboard — The Meridian" },
      {
        name: "description",
        content:
          "In-room guest tablet dashboard: order food and amenities, call reception or the restaurant, request housekeeping, and track every request live.",
      },
      { property: "og:title", content: "Guest Dashboard — In-Room Services" },
      {
        property: "og:description",
        content:
          "Order dining and amenities, contact staff, and track request status in real time from your suite tablet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuestDashboard,
});

function GuestDashboard() {
  const [foodOpen, setFoodOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const { bookingStatus } = useAuth();
  const { guest } = useGuestDashboard();

  const isCheckedIn = bookingStatus === "checked-in";
  const isCheckedOut = bookingStatus === "checked-out";
  const isUpcoming =
    bookingStatus === "reserved" || bookingStatus === "confirmed";

  return (
    <div className="bg-background text-foreground min-h-dvh font-sans">
      <Toaster position="top-right" />
      <main className="mx-auto max-w-[1440px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <DashboardHeader />
        <ErrorBanner />

        {isCheckedOut && (
          <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-950 dark:text-sky-200">
            <div className="flex items-center gap-2 font-bold">
              <Info className="size-4 text-sky-600" />
              <span>Stay Completed · Order & Service Request History</span>
            </div>
            <p className="mt-1 text-xs text-sky-800/90 dark:text-sky-300/80">
              Thank you for staying with us! Your in-room services have
              concluded. You can review your past dining orders, requests, and
              room charges below.
            </p>
          </div>
        )}

        {isUpcoming && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              <Info className="size-4 text-amber-600" />
              <span>Upcoming Reservation · Check-In Required</span>
            </div>
            <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/80">
              Welcome! Your reservation{" "}
              {guest?.reservationNo ? `(#${guest.reservationNo})` : ""} is
              confirmed. In-room dining, luxury amenities, and housekeeping
              requests will activate once you complete check-in at the front
              desk or self-check-in kiosk.
            </p>
          </div>
        )}

        <div className="mt-4">
          <ServicesGrid
            onOpenFood={() => {
              if (isCheckedIn) setFoodOpen(true);
            }}
            onOpenAmenities={() => {
              if (isCheckedIn) setAmenitiesOpen(true);
            }}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <OrdersList />
          <WifiCard />
        </div>
      </main>
      <OrderFoodModal
        open={foodOpen && isCheckedIn}
        onOpenChange={setFoodOpen}
      />
      <OrderAmenitiesModal
        open={amenitiesOpen && isCheckedIn}
        onOpenChange={setAmenitiesOpen}
      />
    </div>
  );
}
