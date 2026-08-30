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
      className={`overflow-hidden rounded-2xl border border-beige-border bg-cream shadow-soft ${className}`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-beige-border bg-ivory/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-muted">
          {label}
        </span>
      </div>

      <div className="p-4">
        <p className="mb-3 text-xs text-muted">{greeting}</p>

        {stats.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-beige-border bg-ivory px-2 py-2"
              >
                <p className="text-sm font-semibold leading-none text-navy">
                  {s.value}
                </p>
                <p className="mt-1 text-[9px] leading-tight text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {chart && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-beige-border bg-ivory p-3">
              <div
                className="h-16 w-16 rounded-full"
                style={{
                  background: `conic-gradient(#766242 0% ${chart.percent}%, #E4E4DC ${chart.percent}% 100%)`,
                }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream">
                    <span className="text-[10px] font-semibold text-navy">
                      {chart.percent}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[9px] text-muted">{chart.label}</p>
            </div>
          )}

          {list && (
            <div className="rounded-lg border border-beige-border bg-ivory p-3">
              <p className="mb-2 text-[9px] font-medium text-muted">
                {list.title}
              </p>
              <div className="space-y-1.5">
                {list.items.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <span className="truncate text-[9px] text-navy/80">
                      {item}
                    </span>
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
