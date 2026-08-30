export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "signal",
  trend,
}) {
  const accents = {
    signal: "bg-signal-100 text-signal-600",
    amber: "bg-amber-100 text-amber-500",
    rose: "bg-rose-100 text-rose-500",
    ink: "bg-ink-950/5 text-ink-body",
  };

  return (
    <div className="border-line rounded-2xl border bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
            {label}
          </p>
          <p className="text-ink-body mt-2 font-mono text-2xl font-semibold">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${accents[accent]}`}
          >
            <Icon size={18} strokeWidth={2.25} />
          </div>
        )}
      </div>
      {trend && (
        <p className="text-ink-muted mt-3 text-xs font-medium">{trend}</p>
      )}
    </div>
  );
}
