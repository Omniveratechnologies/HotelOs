export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "signal",
  trend,
}) {
  const accents = {
    signal: "bg-primary-100 text-primary-800",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    ink: "bg-brand-950/5 text-brand-900",
  };

  return (
    <div className="border-surface-200 rounded-2xl border bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-brand-700/60 text-xs font-semibold tracking-wide uppercase">
            {label}
          </p>
          <p className="text-brand-900 font-display mt-2 text-2xl font-semibold">
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
        <p className="text-brand-700/60 mt-3 text-xs font-medium">{trend}</p>
      )}
    </div>
  );
}
