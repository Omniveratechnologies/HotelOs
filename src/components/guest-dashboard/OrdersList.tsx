import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { useGuestDashboard } from "@/context/GuestDashboardContext";
import { formatMoney, relTime } from "@/utils/format";
import type { Order, ServiceRequest } from "@/types/guest-dashboard";

const ORDER_TERMINAL = ["DELIVERED", "REJECTED", "CANCELLED"];
const REQUEST_TERMINAL = ["COMPLETED", "CANCELLED"];

type ActivityItem =
  | { type: "order"; data: Order }
  | { type: "request"; data: ServiceRequest };

export function OrdersList() {
  const { orders, requests, refreshing, refreshAll } = useGuestDashboard();

  const activity: ActivityItem[] = [
    ...orders.map((o) => ({ type: "order" as const, data: o })),
    ...requests.map((r) => ({ type: "request" as const, data: r })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());

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
          onClick={() => void refreshAll()}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <ul className="mt-4 space-y-3" aria-live="polite" aria-relevant="additions text">
        {activity.length === 0 ? (
          <li className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-muted/70 text-muted-foreground">
              <Inbox className="size-8" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              No active requests. Anything you order will appear here with live status.
            </p>
          </li>
        ) : (
          activity.map((item) => {
            if (item.type === "order") {
              const o = item.data;
              const done = ORDER_TERMINAL.includes(o.status);
              return (
                <li key={o.id} className="animate-fade-in rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">Food Order</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <StatusBadge status={o.status} terminal={done} failed={false} />
                  </div>
                 <p className="mt-3 text-xs text-muted-foreground">
  {relTime(new Date(o.createdAt).getTime())} · {formatMoney(o.totalAmount)} ·{" "}
  {o.paymentMethod === "COD" ? "Cash on Delivery" : `Online — ${o.paymentStatus}`}
</p>
                </li>
              );
            }

            const r = item.data;
            const done = REQUEST_TERMINAL.includes(r.status);
            return (
              <li key={r.id} className="animate-fade-in rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.type.charAt(0) + r.type.slice(1).toLowerCase()}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.items.length > 0 ? r.items.join(", ") : r.description}
                    </p>
                  </div>
                  <StatusBadge status={r.status} terminal={done} failed={false} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{relTime(new Date(r.createdAt).getTime())}</p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}