// oxlint-disable react/only-export-components
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { DashboardHeader } from "@/components/guest-dashboard/DashboardHeader";
import { ErrorBanner } from "@/components/guest-dashboard/ErrorBanner";
import { ServicesGrid } from "@/components/guest-dashboard/ServicesGrid";
import { OrdersList } from "@/components/guest-dashboard/OrdersList";
import { OrderFoodModal } from "@/components/guest-dashboard/OrderFoodModal";
import { OrderAmenitiesModal } from "@/components/guest-dashboard/OrderAmenitiesModal";
import { WifiCard } from "@/components/guest-dashboard/WifiCard";

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
    <div className="bg-background text-foreground min-h-dvh font-sans">
      <Toaster position="top-right" />
      <main className="mx-auto max-w-[1440px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <DashboardHeader />
        <ErrorBanner />
        <div className="mt-4">
          <ServicesGrid
            onOpenFood={() => setFoodOpen(true)}
            onOpenAmenities={() => setAmenitiesOpen(true)}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <OrdersList />
          <WifiCard />
        </div>
      </main>
      <OrderFoodModal open={foodOpen} onOpenChange={setFoodOpen} />
      <OrderAmenitiesModal
        open={amenitiesOpen}
        onOpenChange={setAmenitiesOpen}
      />
    </div>
  );
}
