import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { DashboardHeader } from "@/components/guest-dashboard/DashboardHeader";
import { ErrorBanner } from "@/components/guest-dashboard/ErrorBanner";
import { ServicesGrid } from "@/components/guest-dashboard/ServicesGrid";
import { OrdersList } from "@/components/guest-dashboard/OrdersList";
import { OrderFoodModal } from "@/components/guest-dashboard/OrderFoodModal";
import { OrderAmenitiesModal } from "@/components/guest-dashboard/OrderAmenitiesModal";
import { GuestDashboardProvider, useGuestDashboard } from "@/context/GuestDashboardContext";

export const Route = createFileRoute("/")({
  /** `?room=204` stands in for the room identifier encoded in the in-room QR code. */
  validateSearch: (search: Record<string, unknown>): { room?: string | number } => {
    const room = search["room"];
    // Numeric-looking params arrive parsed as numbers; keep the raw value here
    // and normalise to a string where the room is looked up.
    if (typeof room === "string" || typeof room === "number") return { room };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Guest Dashboard — Suite 1204 | The Meridian" },
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
  component: GuestDashboardRoute,
});

function GuestDashboardRoute() {
  const { room } = Route.useSearch();
  return (
    <GuestDashboardProvider roomNumber={room === undefined ? undefined : String(room)}>
      <GuestDashboard />
    </GuestDashboardProvider>
  );
}

function GuestDashboard() {
  const { pendingKind, submitError, clearSubmitError, placeOrder, sendAmenityRequest } =
    useGuestDashboard();
  const [foodOpen, setFoodOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <Toaster position="top-right" />
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <DashboardHeader />
        <ErrorBanner />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <ServicesGrid
            onOpenFood={() => setFoodOpen(true)}
            onOpenAmenities={() => setAmenitiesOpen(true)}
          />
          <OrdersList />
        </div>
      </main>

      <OrderFoodModal
        open={foodOpen}
        onOpenChange={(open) => {
          setFoodOpen(open);
          if (!open) clearSubmitError();
        }}
        pending={pendingKind === "food"}
        error={submitError}
        onSubmit={placeOrder}
      />
      <OrderAmenitiesModal
        open={amenitiesOpen}
        onOpenChange={(open) => {
          setAmenitiesOpen(open);
          if (!open) clearSubmitError();
        }}
        pending={pendingKind === "amenities"}
        error={submitError}
        onSubmit={sendAmenityRequest}
      />
    </div>
  );
}
