import { ChevronRight, Inbox, List } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SHEET_CONTENT } from "./card-classes";
import { StatusBadge } from "./StatusBadge";
import { useGuestDashboard } from "@/context/useGuestDashboard";
import { formatMoney, relTime } from "@/utils/format";
import type { Order, ServiceRequest } from "@/types/guest-dashboard";
import { SERVICE_ICON } from "./service-icons";
import { useTicker } from "@/hooks/useTicker";

const ORDER_TERMINAL = new Set(["DELIVERED", "REJECTED", "CANCELLED"]);
const REQUEST_TERMINAL = new Set(["COMPLETED", "CANCELLED"]);

function formatRequestType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

type ActivityItem =
  { type: "order"; data: Order } | { type: "request"; data: ServiceRequest };

function ActivityRows({ activity }: { activity: ActivityItem[] }) {
  return (
    <>
      {activity.map((item) => {
        if (item.type === "order") {
          const o = item.data;
          const done = ORDER_TERMINAL.has(o.status);
          return (
            <li
              key={o.id}
              className="animate-fade-in border-border grid grid-cols-[2.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3 border-b py-3 last:border-0"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-orange-100 text-orange-700">
                <SERVICE_ICON.food className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">Food Order</p>
                <p className="text-muted-foreground truncate text-xs">
                  {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={o.status} terminal={done} failed={false} />
                <p className="text-muted-foreground mt-1 text-[0.65rem]">
                  {relTime(new Date(o.createdAt).getTime())}
                </p>
              </div>
              <ChevronRight
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              <span className="sr-only">
                {formatMoney(o.totalAmount)} ·{" "}
                {o.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : `Online — ${o.paymentStatus}`}
              </span>
            </li>
          );
        }

        const r = item.data;
        const done = REQUEST_TERMINAL.has(r.status);
        const Icon =
          SERVICE_ICON[r.type as keyof typeof SERVICE_ICON] ??
          SERVICE_ICON.RECEPTION;
        return (
          <li
            key={r.id}
            className="animate-fade-in border-border grid grid-cols-[2.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3 border-b py-3 last:border-0"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {formatRequestType(r.type)}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {r.items.length > 0 ? r.items.join(", ") : r.description}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={r.status} terminal={done} failed={false} />
              <p className="text-muted-foreground mt-1 text-[0.65rem]">
                {relTime(new Date(r.createdAt).getTime())}
              </p>
            </div>
            <ChevronRight
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </li>
        );
      })}
    </>
  );
}

function ActivityDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: ActivityItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useTicker();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${SHEET_CONTENT} sm:max-w-2xl`}>
        <DialogHeader className="border-border shrink-0 border-b px-5 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-2xl">
            My Orders &amp; Requests
          </DialogTitle>
          <DialogDescription>
            Track the status of all your recent orders and service requests.
          </DialogDescription>
        </DialogHeader>
        <ul
          className="divide-border min-h-0 flex-1 divide-y overflow-y-auto px-4 sm:px-6"
          aria-live="polite"
        >
          {activity.length > 0 ? (
            <ActivityRows activity={activity} />
          ) : (
            <li className="text-muted-foreground py-10 text-center text-sm">
              No orders or requests yet.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function OrdersList() {
  const { orders, requests } = useGuestDashboard();
  const [allOpen, setAllOpen] = useState(false);
  useTicker();

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
      <div className="border-border bg-card/75 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-t-2xl border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <List className="text-brass size-6 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2
              id="orders"
              className="font-display truncate text-xl font-semibold"
            >
              My Orders &amp; Requests
            </h2>
            <p className="text-muted-foreground truncate text-xs">
              Track the status of your recent orders and service requests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-xs font-semibold sm:block">
            Live updates
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9 rounded-full px-3 text-xs"
            onClick={() => setAllOpen(true)}
          >
            View All
          </Button>
        </div>
      </div>

      <ul
        className="divide-border border-border bg-card/75 border-x border-b px-3 sm:px-4"
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
          <ActivityRows activity={activity.slice(0, 6)} />
        )}
      </ul>
      <ActivityDialog
        activity={activity}
        open={allOpen}
        onOpenChange={setAllOpen}
      />
    </section>
  );
}
