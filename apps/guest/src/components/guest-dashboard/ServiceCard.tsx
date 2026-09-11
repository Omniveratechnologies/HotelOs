import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SERVICE_CARD_BASE } from "./card-classes";
import { cn } from "@/lib/utils";

const ACCENT_CLASS: Record<string, string> = {
  food: "bg-orange-100 text-orange-700",
  amenities: "bg-emerald-100 text-emerald-700",
  RESTAURANT: "bg-red-100 text-red-700",
  RECEPTION: "bg-slate-200 text-slate-700",
  HOUSEKEEPING: "bg-blue-100 text-blue-700",
  MEDICINE: "bg-rose-100 text-rose-700",
  TRANSPORT: "bg-sky-100 text-sky-700",
  SPA: "bg-violet-100 text-violet-700",
  MAINTENANCE: "bg-slate-200 text-slate-700",
  EMERGENCY: "bg-red-100 text-red-700",
  LAUNDRY: "bg-purple-100 text-purple-700",
  CONCIERGE: "bg-green-100 text-green-700",
  WAKEUP_CALL: "bg-amber-100 text-amber-700",
  ROOM_CONTROL: "bg-blue-100 text-blue-700",
  FEEDBACK: "bg-emerald-100 text-emerald-700",
};

export function ServiceCard({
  label,
  description,
  icon: Icon,
  pending,
  accent,
  onSelect,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  pending: boolean;
  accent: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={pending}
      className={cn(
        SERVICE_CARD_BASE,
        "group border-border bg-card hover:border-brass flex min-h-[76px] items-center gap-3 rounded-xl border p-2.5 text-left shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
          ACCENT_CLASS[accent] ?? "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold sm:text-sm">
          {label}
        </span>
        <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-[0.65rem] leading-tight sm:text-xs">
          {pending ? "Notifying staff…" : description}
        </span>
      </span>
      <span className="text-muted-foreground shrink-0">
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </button>
  );
}
