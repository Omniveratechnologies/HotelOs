export const KPICard = ({
  label,
  value,
  sub,
  color,
  bg,
  cardBg = "bg-white",
  icon,
}) => (
  <div className={`rounded-2xl border border-gray-100 ${cardBg} p-5 shadow-xs`}>
    <div className="flex items-start justify-between">
      <div>
        <div
          className={`h-10 w-10 ${bg} mb-3 flex items-center justify-center rounded-xl text-xl`}
        >
          {icon}
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="mt-0.5 text-sm font-medium text-gray-700">{label}</div>
        <div className="mt-0.5 text-xs text-gray-400">{sub}</div>
      </div>
    </div>
  </div>
);

export const GuestActivityCard = ({
  label,
  value,
  color,
  guests,
  emptyText,
  cardBg = "bg-white",
}) => (
  <div className={`rounded-2xl border border-gray-100 ${cardBg} p-5 shadow-xs`}>
    <div
      className="mb-2 text-xs font-semibold tracking-wide uppercase"
      style={{ color }}
    >
      {label}
    </div>
    <div className="text-brand-900 text-3xl font-bold">{value}</div>
    <div className="mt-1 text-sm text-gray-400">
      {guests
        .slice(0, 3)
        .map((g) => g.name)
        .join(" · ") || emptyText}
    </div>
  </div>
);

export const MetricSummaryCard = ({ label, value, color }) => (
  <div className="rounded-xl bg-white/5 p-3 text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="mt-1 text-xs tracking-wide text-white/50 uppercase">
      {label}
    </div>
  </div>
);
