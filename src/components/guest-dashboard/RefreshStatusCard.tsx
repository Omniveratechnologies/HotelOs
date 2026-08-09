import { Check, RefreshCw } from "lucide-react";
import { SERVICE_CARD_BASE } from "./card-classes";
import { cn } from "@/lib/utils";

export function RefreshStatusCard({
  refreshing,
  refreshed,
  hasPendingUpdate,
  onRefresh,
}: {
  refreshing: boolean;
  refreshed: boolean;
  hasPendingUpdate: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      className={cn(
        SERVICE_CARD_BASE,
        "border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10",
      )}
    >
      <span className="relative grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
        {refreshed ? (
          <Check className="size-6 animate-pop" aria-hidden="true" />
        ) : (
          <RefreshCw className={cn("size-6", refreshing && "animate-spin")} aria-hidden="true" />
        )}
        {hasPendingUpdate && !refreshing && !refreshed ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-3 animate-soft-pulse rounded-full bg-brass ring-2 ring-background"
          />
        ) : null}
      </span>
      <span>
        <span className="block text-lg font-semibold">Refresh Status</span>
        <span className="block text-sm text-muted-foreground" aria-live="polite">
          {refreshing ? "Contacting server…" : refreshed ? "Updated" : "Pull latest updates"}
        </span>
      </span>
    </button>
  );
}
