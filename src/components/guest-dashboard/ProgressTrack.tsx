import { STATUS_FLOWS } from "@/constants/service-flows";
import { stageIndex } from "@/utils/status";
import { cn } from "@/lib/utils";
import type { ServiceKind, Status } from "@/types/guest-dashboard";

/** Horizontal dot tracker: filled dots for completed stages, hollow for pending. */
export function ProgressTrack({
  kind,
  status,
  failed,
}: {
  kind: ServiceKind;
  status: Status;
  failed?: boolean;
}) {
  const stages = STATUS_FLOWS[kind];
  const current = stageIndex(kind, status);
  const last = stages.length - 1;

  return (
    <div className="mt-4">
      <ol
        className="flex items-center gap-1"
        aria-label={`${status} — stage ${current + 1} of ${stages.length}`}
      >
        {stages.map((stage, i) => (
          <li key={stage} className="flex min-w-0 flex-1 items-center gap-1 last:flex-none">
            <span
              aria-hidden="true"
              className={cn(
                "size-2.5 shrink-0 rounded-full border-2 transition-colors duration-500",
                i <= current
                  ? failed
                    ? "border-destructive bg-destructive"
                    : "border-primary bg-primary"
                  : "border-border bg-transparent",
                i === current && !failed && current < last && "ring-2 ring-primary/25",
              )}
            />
            {i < last ? (
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 min-w-0 flex-1 rounded-full transition-colors duration-500",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-1.5 flex items-center justify-between text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span className="truncate">{stages[0]}</span>
        <span className="truncate">{stages[last]}</span>
      </div>
    </div>
  );
}
