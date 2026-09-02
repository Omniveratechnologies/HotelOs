import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QtyStepper({
  label,
  value,
  onChange,
  max = 9,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  // `bump` re-keys the output so the pop animation replays on every change.
  const [bump, setBump] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setBump((b) => b + 1);
  }, [value]);

  const buttonClass =
    "size-11 rounded-full transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonClass}
        aria-label={`Decrease quantity of ${label}`}
        disabled={value === 0}
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus />
      </Button>
      <output
        key={bump}
        aria-live="polite"
        aria-label={`${label} quantity`}
        className={cn(
          "w-9 text-center text-base font-semibold tabular-nums",
          value > 0 && "text-primary",
          bump > 0 && "animate-pop",
        )}
      >
        {value}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonClass}
        aria-label={`Increase quantity of ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
