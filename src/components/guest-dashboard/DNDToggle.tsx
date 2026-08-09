import { BellRing } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function DNDToggle({
  enabled,
  pending,
  onChange,
}: {
  enabled: boolean;
  pending: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[3.5rem] shrink-0 items-center gap-4 rounded-3xl px-5 py-4 ring-1 transition-colors duration-300",
        enabled
          ? "bg-warning/90 text-warning-foreground ring-warning"
          : "bg-primary-foreground/12 ring-primary-foreground/20",
      )}
    >
      <BellRing className={cn("size-5 shrink-0", enabled && "animate-pop")} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor="dnd" className="block cursor-pointer text-sm font-semibold">
          Do Not Disturb
        </label>
        <p
          className={cn(
            "text-xs",
            enabled ? "text-warning-foreground/80" : "text-primary-foreground/75",
          )}
          aria-live="polite"
        >
          {pending ? "Syncing…" : enabled ? "Active — staff won't disturb you" : "Service allowed"}
        </p>
      </div>
      <Switch
        id="dnd"
        checked={enabled}
        onCheckedChange={onChange}
        aria-describedby="dnd-hint"
        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary"
      />
      <span id="dnd-hint" className="sr-only">
        Updates your room status and notifies housekeeping and reception.
      </span>
    </div>
  );
}
