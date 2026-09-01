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
        "border border-border bg-card shadow-[var(--shadow-card)] hover:border-brass",
      )}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-brass">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-lg font-semibold">{label}</span>
        <span className="block text-sm text-muted-foreground">
          {pending ? "Notifying staff…" : description}
        </span>
      </span>
    </button>
  );
}
