import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModalSuccessOverlay } from "./ModalSuccessOverlay";
import { SHEET_CONTENT } from "./card-classes";
import { MODAL_SUCCESS_MS } from "@/constants/service-flows";
import { useGuestDashboard } from "@/context/useGuestDashboard";
import type { ServiceRequestType } from "@/types/guest-dashboard";

type FormKind =
  "FEEDBACK" | "WAKEUP_CALL" | "ROOM_CONTROL" | "MEDICINE" | "MAINTENANCE";

const TITLES: Record<FormKind, string> = {
  FEEDBACK: "Share feedback",
  WAKEUP_CALL: "Schedule a wake-up call",
  ROOM_CONTROL: "Room controls",
  MEDICINE: "Order medicine",
  MAINTENANCE: "Report a maintenance issue",
};

export function ActionRequestModal({
  kind,
  open,
  onOpenChange,
}: {
  kind: FormKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sendServiceRequest } = useGuestDashboard();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [device, setDevice] = useState("Lights");
  const [action, setAction] = useState("On");
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setRating(0);
    setComment("");
    setRequestedTime("");
    setDevice("Lights");
    setAction("On");
    setValue("");
    setError(null);
  };

  const submit = async () => {
    if (!kind) return;
    if (kind === "FEEDBACK" && rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if ((kind === "MEDICINE" || kind === "MAINTENANCE") && !value.trim()) {
      setError("Please add a little more detail.");
      return;
    }
    if (kind === "WAKEUP_CALL" && !requestedTime) {
      setError("Please choose a time.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const description =
        kind === "FEEDBACK"
          ? comment
          : kind === "MEDICINE"
            ? value
            : kind === "WAKEUP_CALL"
              ? "Wake-up call request"
              : kind === "ROOM_CONTROL"
                ? "Room control request"
                : value;
      const details =
        kind === "FEEDBACK"
          ? { rating }
          : kind === "WAKEUP_CALL"
            ? { requestedTime }
            : kind === "ROOM_CONTROL"
              ? { device, action }
              : undefined;
      await sendServiceRequest(
        kind as ServiceRequestType,
        description,
        kind === "MEDICINE" ? [value.trim()] : undefined,
        details,
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        reset();
        onOpenChange(false);
      }, MODAL_SUCCESS_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send request");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className={`${SHEET_CONTENT} sm:max-w-md`}>
        <DialogHeader className="border-border shrink-0 border-b px-5 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-2xl">
            {kind ? TITLES[kind] : "Request"}
          </DialogTitle>
          <DialogDescription>
            We&apos;ll send this request directly to the hotel team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 py-6 sm:px-6">
          {kind === "FEEDBACK" ? (
            <>
              <div>
                <p className="mb-2 text-sm font-semibold">How was your stay?</p>
                <div
                  className="flex gap-2"
                  role="radiogroup"
                  aria-label="Rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl leading-none ${star <= rating ? "text-brass" : "text-muted-foreground/30"}`}
                      aria-label={`${star} star${star === 1 ? "" : "s"}`}
                      aria-pressed={star <= rating}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm font-semibold">
                Comments
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="border-input bg-background focus:ring-ring mt-2 min-h-24 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2"
                  placeholder="Tell us about your stay"
                />
              </label>
            </>
          ) : null}
          {kind === "WAKEUP_CALL" ? (
            <label className="block text-sm font-semibold">
              Wake-up time
              <input
                type="time"
                value={requestedTime}
                onChange={(event) => setRequestedTime(event.target.value)}
                className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
              />
            </label>
          ) : null}
          {kind === "ROOM_CONTROL" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Device
                <select
                  value={device}
                  onChange={(event) => setDevice(event.target.value)}
                  className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                >
                  <option>Lights</option>
                  <option>AC</option>
                  <option>Curtains</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Action
                <select
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                >
                  <option>On</option>
                  <option>Off</option>
                  <option>Adjust</option>
                </select>
              </label>
            </div>
          ) : null}
          {kind === "MEDICINE" ? (
            <label className="block text-sm font-semibold">
              What do you need?
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                placeholder="e.g. paracetamol"
              />
            </label>
          ) : null}
          {kind === "MAINTENANCE" ? (
            <label className="block text-sm font-semibold">
              Describe the issue
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="border-input bg-background focus:ring-ring mt-2 min-h-24 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2"
                placeholder="What needs attention?"
              />
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
        </div>
        <div className="border-border bg-secondary/40 border-t px-5 py-4 sm:px-6">
          <Button
            size="lg"
            className="min-h-12 w-full rounded-full"
            disabled={pending}
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
