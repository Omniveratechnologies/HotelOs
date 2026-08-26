export default function DashboardMockup({
  label = "Front Desk",
  greeting = "Welcome back, Aria",
  stats = [],
  chart = null,
  list = null,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl bg-cream border border-beige-border shadow-soft overflow-hidden ${className}`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-beige-border bg-ivory/60">
        <span className="w-2.5 h-2.5 rounded-full bg-gold/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold/40" />
        <span className="ml-3 text-[11px] font-medium text-muted tracking-wide">{label}</span>
      </div>

      <div className="p-4">
        <p className="text-xs text-muted mb-3">{greeting}</p>

        {stats.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-ivory border border-beige-border px-2 py-2">
                <p className="text-sm font-semibold text-navy leading-none">{s.value}</p>
                <p className="text-[9px] text-muted mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {chart && (
            <div className="rounded-lg bg-ivory border border-beige-border p-3 flex flex-col items-center justify-center">
              <div
                className="w-16 h-16 rounded-full"
                style={{
                  background: `conic-gradient(#766242 0% ${chart.percent}%, #E4E4DC ${chart.percent}% 100%)`,
                }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-navy">{chart.percent}%</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-muted mt-2">{chart.label}</p>
            </div>
          )}

          {list && (
            <div className="rounded-lg bg-ivory border border-beige-border p-3">
              <p className="text-[9px] font-medium text-muted mb-2">{list.title}</p>
              <div className="space-y-1.5">
                {list.items.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                    <span className="text-[9px] text-navy/80 truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
