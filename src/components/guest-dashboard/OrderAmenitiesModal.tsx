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
import { ModalSuccessOverlay } from "./ModalSuccessOverlay";
import { SHEET_CONTENT } from "./card-classes";
import { AMENITIES } from "@/data/amenities";
import { MODAL_SUCCESS_MS } from "@/constants/service-flows";
import type { RequestItem } from "@/types/guest-dashboard";

export function OrderAmenitiesModal({
  open,
  onOpenChange,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (items: RequestItem[]) => Promise<boolean> | boolean;
  pending: boolean;
  error?: string | null;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [success, setSuccess] = useState(false);

  const items = useMemo<RequestItem[]>(
    () =>
      AMENITIES.filter((amenity) => (quantities[amenity.name] ?? 0) > 0).map((amenity) => ({
        name: amenity.name,
        qty: quantities[amenity.name] ?? 0,
      })),
    [quantities],
  );

  const submit = async () => {
    const ok = await onSubmit(items);
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
      <DialogContent className={`${SHEET_CONTENT} sm:max-w-2xl`}>
        <DialogHeader className="shrink-0 border-b border-border px-5 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-2xl">Room Amenities</DialogTitle>
          <DialogDescription>Housekeeping typically delivers within 15 minutes.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ul className="grid gap-2 px-5 py-6 sm:grid-cols-2 sm:px-6">
            {AMENITIES.map((amenity) => (
              <li
                key={amenity.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brass"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{amenity.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{amenity.note}</p>
                </div>
                <QtyStepper
                  label={amenity.name}
                  value={quantities[amenity.name] ?? 0}
                  onChange={(qty) =>
                    setQuantities((current) => ({ ...current, [amenity.name]: qty }))
                  }
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border bg-secondary/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
          {error ? (
            <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              {error} — nothing was sent.
              <button
                type="button"
                onClick={submit}
                className="rounded-full font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {items.length} item type{items.length === 1 ? "" : "s"} selected
            </p>
          )}
          <Button
            size="lg"
            className="min-h-12 w-full rounded-full px-8 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            disabled={items.length === 0 || pending}
            onClick={submit}
          >
            {pending ? "Sending…" : "Send Request"}
          </Button>
        </div>

        {success ? <ModalSuccessOverlay /> : null}
      </DialogContent>
    </Dialog>
  );
}
