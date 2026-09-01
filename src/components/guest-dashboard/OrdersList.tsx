import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { ProgressTrack } from "./ProgressTrack";
import { SERVICE_ICON } from "./service-icons";
import { useGuestDashboard } from "@/context/GuestDashboardContext";
import { SERVICE_LABEL } from "@/constants/service-flows";
import { formatMoney, relTime } from "@/utils/format";
import { isTerminal } from "@/utils/status";

export function OrdersList() {
  const { requests, refreshing, refreshStatus } = useGuestDashboard();

  return (
    <section aria-labelledby="orders">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 id="orders" className="truncate font-display text-2xl font-semibold">
          My Orders &amp; Requests
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0 rounded-full transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => void refreshStatus()}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <ul className="mt-4 space-y-3" aria-live="polite" aria-relevant="additions text">
        {requests.length === 0 ? (
          <li className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-muted/70 text-muted-foreground">
              <Inbox className="size-8" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              No active requests. Anything you order will appear here with live status.
            </p>
          </li>
        ) : (
          requests.map((request) => {
            const done = isTerminal(request.kind, request.status);
            const Icon = SERVICE_ICON[request.kind];
            return (
              <li
                key={request.id}
                className="animate-fade-in rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{SERVICE_LABEL[request.kind]}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {request.items.map((item) => `${item.name} ×${item.qty}`).join(", ")}
                    </p>
                  </div>
                  <StatusBadge status={request.status} terminal={done} failed={!!request.failed} />
                </div>

                <ProgressTrack
                  kind={request.kind}
                  status={request.status}
                  failed={!!request.failed}
                />

                <p className="mt-3 text-xs text-muted-foreground">
                  {relTime(request.createdAt)}
                  {request.total ? ` · ${formatMoney(request.total)}` : ""}
                  {request.payment
                    ? ` · ${request.payment === "cod" ? "Cash on Delivery" : "Online Payment"}`
                    : ""}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
