import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "./QtyStepper";
import { PaymentChoice } from "./PaymentChoice";
import { ModalSuccessOverlay } from "./ModalSuccessOverlay";
import { SHEET_CONTENT } from "./card-classes";
import { useGuestDashboard } from "@/context/GuestDashboardContext";
import { MODAL_SUCCESS_MS } from "@/constants/service-flows";
import { formatMoney } from "@/utils/format";

export function OrderFoodModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { menu, placeOrder } = useGuestDashboard();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<"COD" | "ONLINE">("COD");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, typeof menu>();
    for (const item of menu) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [menu]);

  const { cartItems, total, count } = useMemo(() => {
    const items: { foodItemId: string; quantity: number }[] = [];
    let sum = 0, units = 0;
    for (const item of menu) {
      const qty = quantities[item.id] ?? 0;
      if (qty > 0) {
        items.push({ foodItemId: item.id, quantity: qty });
        sum += qty * item.price;
        units += qty;
      }
    }
    return { cartItems: items, total: sum, count: units };
  }, [quantities, menu]);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      if (payment === "ONLINE") {
        onOpenChange(false);
      }
      await placeOrder(cartItems, payment);
      if (payment === "COD") {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setQuantities({});
          onOpenChange(false);
        }, MODAL_SUCCESS_MS);
      } else {
        setQuantities({});
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Payment was cancelled") {
        setQuantities({});
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't place order");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${SHEET_CONTENT} sm:max-w-3xl`}>
        <DialogHeader className="shrink-0 border-b border-border px-5 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-2xl">In-Room Dining</DialogTitle>
          <DialogDescription>Served to your suite in 25–40 minutes. Kitchen open 24 hours.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="divide-y divide-border px-5 sm:px-6">
            {categories.map(([category, items]) => (
              <section key={category} className="py-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brass">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.name}</p>
                        {item.description ? <p className="truncate text-sm text-muted-foreground">{item.description}</p> : null}
                        <p className="mt-1 text-sm font-semibold text-primary">{formatMoney(item.price)}</p>
                      </div>
                      <QtyStepper
                        label={item.name}
                        value={quantities[item.id] ?? 0}
                        onChange={(qty) => setQuantities((c) => ({ ...c, [item.id]: qty }))}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="shrink-0 space-y-4 border-t border-border bg-secondary/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
          <PaymentChoice value={payment === "COD" ? "cod" : "online"} onChange={(v) => setPayment(v === "cod" ? "COD" : "ONLINE")} />

          {error ? (
            <p role="alert" className="flex flex-wrap items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error} — your cart is safe.
              <button type="button" onClick={submit} className="rounded-full font-semibold underline underline-offset-4">Retry</button>
            </p>
          ) : null}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 text-base font-semibold sm:text-lg" aria-live="polite">
              <span className="font-display text-2xl text-primary">{formatMoney(total)}</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>
            </p>
            <Button size="lg" className="min-h-12 rounded-full px-8" disabled={cartItems.length === 0 || pending} onClick={submit}>
              {pending ? "Sending…" : "Place Order"}
            </Button>
          </div>
        </div>

        {success ? <ModalSuccessOverlay /> : null}
      </DialogContent>
    </Dialog>
  );
}