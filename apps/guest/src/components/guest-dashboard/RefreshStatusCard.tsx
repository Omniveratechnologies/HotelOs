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
        "border-primary/40 bg-primary/5 hover:bg-primary/10 border border-dashed",
      )}
    >
      <span className="bg-primary text-primary-foreground relative grid size-12 place-items-center rounded-2xl">
        {refreshed ? (
          <Check className="animate-pop size-6" aria-hidden="true" />
        ) : (
          <RefreshCw
            className={cn("size-6", refreshing && "animate-spin")}
            aria-hidden="true"
          />
        )}
        {hasPendingUpdate && !refreshing && !refreshed ? (
          <span
            aria-hidden="true"
            className="animate-soft-pulse bg-brass ring-background absolute -top-1 -right-1 size-3 rounded-full ring-2"
          />
        ) : null}
      </span>
      <span>
        <span className="block text-lg font-semibold">Refresh Status</span>
        <span
          className="text-muted-foreground block text-sm"
          aria-live="polite"
        >
          {refreshing
            ? "Contacting server…"
            : refreshed
              ? "Updated"
              : "Pull latest updates"}
        </span>
      </span>
    </button>
  );
}
