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
import { useGuestDashboard } from "@/context/useGuestDashboard";
import { MODAL_SUCCESS_MS } from "@/constants/service-flows";

export function OrderAmenitiesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sendServiceRequest } = useGuestDashboard();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedItems = useMemo(
    () =>
      AMENITIES.filter((a) => (quantities[a.name] ?? 0) > 0).map(
        (a) => `${a.name} ×${quantities[a.name]}`,
      ),
    [quantities],
  );

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await sendServiceRequest("AMENITY", "Amenity request", selectedItems);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setQuantities({});
        onOpenChange(false);
      }, MODAL_SUCCESS_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send request");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${SHEET_CONTENT} sm:max-w-2xl`}>
        <DialogHeader className="border-border shrink-0 border-b px-5 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-2xl">
            Room Amenities
          </DialogTitle>
          <DialogDescription>
            Housekeeping typically delivers within 15 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ul className="grid gap-2 px-5 py-6 sm:grid-cols-2 sm:px-6">
            {AMENITIES.map((amenity) => (
              <li
                key={amenity.name}
                className="border-border bg-card hover:border-brass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{amenity.name}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {amenity.note}
                  </p>
                </div>
                <QtyStepper
                  label={amenity.name}
                  value={quantities[amenity.name] ?? 0}
                  onChange={(qty) =>
                    setQuantities((c) => ({ ...c, [amenity.name]: qty }))
                  }
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="border-border bg-secondary/40 shrink-0 space-y-3 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
          {error ? (
            <p
              role="alert"
              className="text-destructive flex flex-wrap items-center gap-2 text-sm"
            >
              {error} — nothing was sent.
              <button
                type="button"
                onClick={submit}
                className="rounded-full font-semibold underline underline-offset-4"
              >
                Retry
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {selectedItems.length} item type
              {selectedItems.length === 1 ? "" : "s"} selected
            </p>
          )}
          <Button
            size="lg"
            className="min-h-12 w-full rounded-full px-8 sm:w-auto"
            disabled={selectedItems.length === 0 || pending}
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
