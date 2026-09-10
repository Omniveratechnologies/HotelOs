import { ServiceCard } from "./ServiceCard";
import { SERVICE_ICON } from "./service-icons";
import { useGuestDashboard } from "@/context/useGuestDashboard";
import { cn } from "@/lib/utils";
import { ChevronRight, Grid2X2, Zap } from "lucide-react";
import { ActionRequestModal } from "./ActionRequestModal";
import { useState } from "react";
import type { ServiceRequestType } from "@/types/guest-dashboard";

type ServiceAction = {
  kind: ServiceRequestType | "food" | "amenities";
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
  const { dnd, sendServiceRequest } = useGuestDashboard();
  const [formKind, setFormKind] = useState<
    | "FEEDBACK"
    | "WAKEUP_CALL"
    | "ROOM_CONTROL"
    | "MEDICINE"
    | "MAINTENANCE"
    | null
  >(null);

  const actions: ServiceAction[] = [
    {
      kind: "food",
      label: "Order Food",
      description: "24h in-room dining",
      run: onOpenFood,
    },
    {
      kind: "amenities",
      label: "Order Amenities",
      description: "Towels, pillows & more",
      run: onOpenAmenities,
    },
    {
      kind: "RESTAURANT",
      label: "Call Restaurant",
      description: "Speak to our kitchen team",
      run: () => void sendServiceRequest("RESTAURANT", "Restaurant callback"),
    },
    {
      kind: "RECEPTION",
      label: "Contact Reception",
      description: "We're here to help 24/7",
      run: () => void sendServiceRequest("RECEPTION", "Reception callback"),
    },
    {
      kind: "HOUSEKEEPING",
      label: "Request Housekeeping",
      description: "Request cleaning or extra amenities",
      run: () => void sendServiceRequest("HOUSEKEEPING", "Room cleaning"),
    },
    {
      kind: "MEDICINE",
      label: "Order Medicine",
      description: "Request medicines to your room",
      run: () => void sendServiceRequest("MEDICINE", "Medicine request"),
    },
    {
      kind: "TRANSPORT",
      label: "Book Transport",
      description: "Taxi, airport transfer or local travel",
      run: () =>
        void sendServiceRequest("TRANSPORT", "Transport booking request"),
    },
    {
      kind: "SPA",
      label: "Book Spa",
      description: "Relax and rejuvenate",
      run: () => void sendServiceRequest("SPA", "Spa booking request"),
    },
    {
      kind: "MAINTENANCE",
      label: "Maintenance",
      description: "Report an issue",
      run: () =>
        void sendServiceRequest("MAINTENANCE", "Maintenance issue report"),
    },
    {
      kind: "EMERGENCY",
      label: "Emergency",
      description: "Get immediate assistance",
      run: () =>
        void sendServiceRequest("EMERGENCY", "Emergency assistance needed"),
    },
    {
      kind: "LAUNDRY",
      label: "Laundry Service",
      description: "Wash, dry and press",
      run: () => void sendServiceRequest("LAUNDRY", "Laundry pickup request"),
    },
    {
      kind: "CONCIERGE",
      label: "Concierge",
      description: "Tours, tickets and special requests",
      run: () => void sendServiceRequest("CONCIERGE", "Concierge request"),
    },
    {
      kind: "WAKEUP_CALL",
      label: "Wake-up Call",
      description: "Set a wake-up time",
      run: () => void sendServiceRequest("WAKEUP_CALL", "Wake-up call request"),
    },
    {
      kind: "ROOM_CONTROL",
      label: "Room Controls",
      description: "Lights, AC and more",
      run: () =>
        void sendServiceRequest("ROOM_CONTROL", "Room control request"),
    },
    {
      kind: "FEEDBACK",
      label: "Feedback",
      description: "Share your experience",
      run: () => void sendServiceRequest("FEEDBACK", "Guest feedback"),
    },
  ];

  return (
    <section aria-labelledby="services">
      <div className="border-border bg-card/75 flex items-center justify-between rounded-t-2xl border border-b-0 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <Zap
            className="text-brass size-6"
            fill="currentColor"
            aria-hidden="true"
          />
          <div>
            <h2 id="services" className="font-display text-xl font-semibold">
              Quick Actions
            </h2>
            <p className="text-muted-foreground text-xs">
              Get the services you need with just one tap.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-foreground border-border hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:flex"
        >
          <Grid2X2 className="size-3.5" aria-hidden="true" /> View All Services{" "}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div
        className={cn(
          "border-border bg-card/75 relative grid grid-cols-2 gap-2 rounded-b-2xl border p-3 transition-all duration-300 sm:p-4 md:grid-cols-3 xl:grid-cols-5",
          dnd && "opacity-70 saturate-[0.7]",
        )}
      >
        {dnd ? (
          <div
            aria-hidden="true"
            className="bg-warning/8 pointer-events-none absolute -inset-2 rounded-[2rem]"
          />
        ) : null}
        {actions.map((action) => (
          <ServiceCard
            key={action.kind}
            label={action.label}
            description={action.description}
            icon={SERVICE_ICON[action.kind as keyof typeof SERVICE_ICON]}
            pending={false}
            accent={action.kind}
            onSelect={
              [
                "FEEDBACK",
                "WAKEUP_CALL",
                "ROOM_CONTROL",
                "MEDICINE",
                "MAINTENANCE",
              ].includes(action.kind)
                ? () =>
                    setFormKind(
                      action.kind as
                        | "FEEDBACK"
                        | "WAKEUP_CALL"
                        | "ROOM_CONTROL"
                        | "MEDICINE"
                        | "MAINTENANCE",
                    )
                : action.run
            }
          />
        ))}
      </div>
      <ActionRequestModal
        kind={formKind}
        open={formKind !== null}
        onOpenChange={(open) => {
          if (!open) setFormKind(null);
        }}
      />
    </section>
  );
}
