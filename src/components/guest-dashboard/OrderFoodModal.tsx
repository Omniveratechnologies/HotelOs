import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "./QtyStepper";
import { PaymentChoice } from "./PaymentChoice";
import { ModalSuccessOverlay } from "./ModalSuccessOverlay";
import { SHEET_CONTENT } from "./card-classes";
import { FOOD_MENU } from "@/data/menu";
import { MODAL_SUCCESS_MS } from "@/constants/service-flows";
import { formatMoney } from "@/utils/format";
import type { PaymentMethod, RequestItem } from "@/types/guest-dashboard";

export function OrderFoodModal({
  open,
  onOpenChange,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    items: RequestItem[],
    total: number,
    payment: PaymentMethod,
  ) => Promise<boolean> | boolean;
  pending: boolean;
  error?: string | null;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [success, setSuccess] = useState(false);

  const { items, total, count } = useMemo(() => {
    const selected: RequestItem[] = [];
    let sum = 0;
    let units = 0;
    for (const group of FOOD_MENU)
      for (const item of group.items) {
        const qty = quantities[item.name] ?? 0;
        if (qty > 0) {
          selected.push({ name: item.name, qty, price: item.price });
          sum += qty * item.price;
          units += qty;
        }
      }
    return { items: selected, total: sum, count: units };
  }, [quantities]);

  const submit = async () => {
    const ok = await onSubmit(items, total, payment);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setQuantities({});
        onOpenChange(false);
      }, MODAL_SUCCESS_MS);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${SHEET_CONTENT} sm:max-w-3xl`}>
        <DialogHeader className="shrink-0 border-b border-border px-5 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-2xl">In-Room Dining</DialogTitle>
          <DialogDescription>
            Served to your suite in 25–40 minutes. Kitchen open 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="divide-y divide-border px-5 sm:px-6">
            {FOOD_MENU.map((group) => (
              <section
                key={group.category}
                aria-labelledby={`cat-${group.category}`}
                className="py-6"
              >
                <h3
                  id={`cat-${group.category}`}
                  className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brass"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{item.note}</p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {formatMoney(item.price)}
                        </p>
                      </div>
                      <QtyStepper
                        label={item.name}
                        value={quantities[item.name] ?? 0}
                        onChange={(qty) =>
                          setQuantities((current) => ({ ...current, [item.name]: qty }))
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="shrink-0 space-y-4 border-t border-border bg-secondary/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
          <PaymentChoice value={payment} onChange={setPayment} />

          {error ? (
            <p
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              {error} — your cart is safe.
              <button
                type="button"
                onClick={submit}
                className="rounded-full font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </p>
          ) : null}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 text-base font-semibold sm:text-lg" aria-live="polite">
              <span className="font-display text-2xl text-primary">{formatMoney(total)}</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {count} item{count === 1 ? "" : "s"}
              </span>
            </p>
            <Button
              size="lg"
              className="min-h-12 rounded-full px-8 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={items.length === 0 || pending}
              onClick={submit}
            >
              {pending ? "Sending…" : "Place Order"}
            </Button>
          </div>
        </div>

        {success ? <ModalSuccessOverlay /> : null}
      </DialogContent>
    </Dialog>
  );
}
