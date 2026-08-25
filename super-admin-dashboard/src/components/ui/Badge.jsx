const VARIANTS = {
  active: "bg-signal-100 text-signal-600",
  deactivated: "bg-rose-100 text-rose-500",
  expiring_soon: "bg-amber-100 text-amber-500",
  expired: "bg-rose-100 text-rose-500",
  open: "bg-rose-100 text-rose-500",
  in_progress: "bg-amber-100 text-amber-500",
  resolved: "bg-signal-100 text-signal-600",
  high: "bg-rose-100 text-rose-500",
  medium: "bg-amber-100 text-amber-500",
  low: "bg-ink-950/5 text-ink-muted",
  neutral: "bg-ink-950/5 text-ink-muted",
};

const LABELS = {
  active: "Active",
  deactivated: "Deactivated",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function Badge({ status, children }) {
  const variant = VARIANTS[status] || VARIANTS.neutral;
  const label = children ?? LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${variant}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
