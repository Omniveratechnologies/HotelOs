import { Check } from "lucide-react";

/** Full-cover success checkmark shown briefly after a modal submit succeeds. */
export function ModalSuccessOverlay() {
  return (
    <div className="bg-background/85 absolute inset-0 grid place-items-center backdrop-blur-sm">
      <span className="animate-check-pulse bg-success text-success-foreground grid size-20 place-items-center rounded-full">
        <Check className="size-10" aria-hidden="true" />
      </span>
    </div>
  );
}
