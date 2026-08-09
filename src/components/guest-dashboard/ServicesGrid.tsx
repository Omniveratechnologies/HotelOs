import { ServiceCard } from "./ServiceCard";
import { RefreshStatusCard } from "./RefreshStatusCard";
import { SERVICE_ICON } from "./service-icons";
import { useGuestDashboard } from "@/context/GuestDashboardContext";
import { cn } from "@/lib/utils";
import type { ServiceKind } from "@/types/guest-dashboard";

type ServiceAction = {
  kind: ServiceKind;
  label: string;
  description: string;
  run: () => void;
};

export function ServicesGrid({
  onOpenFood,
  onOpenAmenities,
}: {
  onOpenFood: () => void;
  onOpenAmenities: () => void;
}) {
  const {
    dnd,
    pendingKind,
    refreshing,
    refreshed,
    hasPendingUpdate,
    refreshStatus,
    sendServiceRequest,
  } = useGuestDashboard();

  const actions: ServiceAction[] = [
    { kind: "food", label: "Order Food", description: "24h in-room dining", run: onOpenFood },
    {
      kind: "amenities",
      label: "Order Amenities",
      description: "Towels, pillows & more",
      run: onOpenAmenities,
    },
    {
      kind: "restaurant",
      label: "Call Restaurant",
      description: "Speak to the maître d'",
      run: () => void sendServiceRequest("restaurant", [{ name: "Restaurant callback", qty: 1 }]),
    },
    {
      kind: "reception",
      label: "Contact Reception",
      description: "Front desk assistance",
      run: () => void sendServiceRequest("reception", [{ name: "Reception callback", qty: 1 }]),
    },
    {
      kind: "housekeeping",
      label: "Request Housekeeping",
      description: "Clean my suite",
      run: () => void sendServiceRequest("housekeeping", [{ name: "Room cleaning", qty: 1 }]),
    },
  ];

  return (
    <section aria-labelledby="services">
      <h2 id="services" className="font-display text-2xl font-semibold">
        Guest Services
      </h2>
      <div
        className={cn(
          "relative mt-4 grid gap-4 rounded-3xl transition-all duration-300 sm:grid-cols-2 xl:grid-cols-3",
          dnd && "opacity-70 saturate-[0.7]",
        )}
      >
        {dnd ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-warning/8"
          />
        ) : null}
        {actions.map((action) => (
          <ServiceCard
            key={action.kind}
            label={action.label}
            description={action.description}
            icon={SERVICE_ICON[action.kind]}
            pending={pendingKind === action.kind}
            onSelect={action.run}
          />
        ))}

        <RefreshStatusCard
          refreshing={refreshing}
          refreshed={refreshed}
          hasPendingUpdate={hasPendingUpdate}
          onRefresh={() => void refreshStatus()}
        />
      </div>
    </section>
  );
}
