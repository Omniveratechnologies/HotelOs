import type { LucideIcon } from "lucide-react";
import { SERVICE_CARD_BASE } from "./card-classes";
import { cn } from "@/lib/utils";

export function ServiceCard({
  label,
  description,
  icon: Icon,
  pending,
  onSelect,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  pending: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={pending}
      className={cn(
        SERVICE_CARD_BASE,
        "border-border bg-card hover:border-brass border shadow-[var(--shadow-card)]",
      )}
    >
      <span className="bg-accent text-accent-foreground group-hover:bg-brass grid size-12 place-items-center rounded-2xl transition-colors">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-lg font-semibold">{label}</span>
        <span className="text-muted-foreground block text-sm">
          {pending ? "Notifying staff…" : description}
        </span>
      </span>
    </button>
  );
}
