import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusTone, type StatusTone } from "@/utils/status";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  amber: "bg-warning/18 text-warning-foreground",
  blue: "bg-info/15 text-info",
  green: "bg-success/14 text-success",
  red: "bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  terminal,
  failed,
}: {
  status: string;
  terminal: boolean;
  failed?: boolean;
}) {
  const tone = statusTone(status, failed);
  const Icon = failed ? AlertTriangle : terminal ? CheckCircle2 : Loader2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        TONE_CLASS[tone],
      )}
    >
      <Icon
        className={cn("size-3.5", !terminal && !failed && "animate-spin")}
        aria-hidden="true"
      />
      {status.replaceAll("_", " ")}
    </span>
  );
}
