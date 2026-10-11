const VARIANTS = {
  active: "bg-emerald-50 text-emerald-700",
  deactivated: "bg-rose-50 text-rose-700",
  expiring_soon: "bg-amber-50 text-amber-700",
  expired: "bg-rose-50 text-rose-700",
  open: "bg-rose-50 text-rose-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-brand-950/5 text-brand-700/70",
  neutral: "bg-brand-950/5 text-brand-700/70",
  under_review: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
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
  under_review: "Under review",
  completed: "Completed",
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
