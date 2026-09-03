import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { useGuestDashboard } from "@/context/useGuestDashboard";
import { formatMoney, relTime } from "@/utils/format";
import type { Order, ServiceRequest } from "@/types/guest-dashboard";

const ORDER_TERMINAL = new Set(["DELIVERED", "REJECTED", "CANCELLED"]);
const REQUEST_TERMINAL = new Set(["COMPLETED", "CANCELLED"]);

type ActivityItem =
  { type: "order"; data: Order } | { type: "request"; data: ServiceRequest };

export function OrdersList() {
  const { orders, requests, refreshing, refreshAll } = useGuestDashboard();

  const activity: ActivityItem[] = [
    ...orders.map((o) => ({ type: "order" as const, data: o })),
    ...requests.map((r) => ({ type: "request" as const, data: r })),
  ].toSorted(
    (a, b) =>
      new Date(b.data.createdAt).getTime() -
      new Date(a.data.createdAt).getTime(),
  );

  return (
    <section aria-labelledby="orders">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2
          id="orders"
          className="font-display truncate text-2xl font-semibold"
        >
          My Orders &amp; Requests
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="focus-visible:ring-ring min-h-11 shrink-0 rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
          onClick={() => void refreshAll()}
          disabled={refreshing}
        >
          <RefreshCw
            className={refreshing ? "animate-spin" : ""}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <ul
        className="mt-4 space-y-3"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {activity.length === 0 ? (
          <li className="border-border bg-card/60 flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center">
            <span className="bg-muted/70 text-muted-foreground grid size-16 place-items-center rounded-full">
              <Inbox className="size-8" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <p className="text-muted-foreground text-sm">
              No active requests. Anything you order will appear here with live
              status.
            </p>
          </li>
        ) : (
          activity.map((item) => {
            if (item.type === "order") {
              const o = item.data;
              const done = ORDER_TERMINAL.has(o.status);
              return (
                <li
                  key={o.id}
                  className="animate-fade-in border-border bg-card rounded-3xl border p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">Food Order</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {o.items
                          .map((i) => `${i.name} ×${i.quantity}`)
                          .join(", ")}
                      </p>
                    </div>
                    <StatusBadge
                      status={o.status}
                      terminal={done}
                      failed={false}
                    />
                  </div>
                  <p className="text-muted-foreground mt-3 text-xs">
                    {relTime(new Date(o.createdAt).getTime())} ·{" "}
                    {formatMoney(o.totalAmount)} ·{" "}
                    {o.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : `Online — ${o.paymentStatus}`}
                  </p>
                </li>
              );
            }

            const r = item.data;
            const done = REQUEST_TERMINAL.has(r.status);
            return (
              <li
                key={r.id}
                className="animate-fade-in border-border bg-card rounded-3xl border p-5 shadow-[var(--shadow-card)]"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {r.type.charAt(0) + r.type.slice(1).toLowerCase()}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {r.items.length > 0 ? r.items.join(", ") : r.description}
                    </p>
                  </div>
                  <StatusBadge
                    status={r.status}
                    terminal={done}
                    failed={false}
                  />
                </div>
                <p className="text-muted-foreground mt-3 text-xs">
                  {relTime(new Date(r.createdAt).getTime())}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
