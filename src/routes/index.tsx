import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { DashboardHeader } from "@/components/guest-dashboard/DashboardHeader";
import { ErrorBanner } from "@/components/guest-dashboard/ErrorBanner";
import { ServicesGrid } from "@/components/guest-dashboard/ServicesGrid";
import { OrdersList } from "@/components/guest-dashboard/OrdersList";
import { OrderFoodModal } from "@/components/guest-dashboard/OrderFoodModal";
import { OrderAmenitiesModal } from "@/components/guest-dashboard/OrderAmenitiesModal";

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
      <OrderFoodModal open={foodOpen} onOpenChange={setFoodOpen} />
      <OrderAmenitiesModal open={amenitiesOpen} onOpenChange={setAmenitiesOpen} />
    </div>
  );
}