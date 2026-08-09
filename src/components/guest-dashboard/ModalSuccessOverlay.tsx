import { Check } from "lucide-react";

/** Full-cover success checkmark shown briefly after a modal submit succeeds. */
export function ModalSuccessOverlay() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-background/85 backdrop-blur-sm">
      <span className="grid size-20 animate-check-pulse place-items-center rounded-full bg-success text-success-foreground">
        <Check className="size-10" aria-hidden="true" />
      </span>
    </div>
  );
}
