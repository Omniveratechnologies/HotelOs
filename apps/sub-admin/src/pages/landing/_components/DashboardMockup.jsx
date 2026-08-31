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
      className={`border-beige-border bg-cream shadow-soft overflow-hidden rounded-2xl border ${className}`}
    >
      {/* window chrome */}
      <div className="border-beige-border bg-ivory/60 flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-gold/40 h-2.5 w-2.5 rounded-full" />
        <span className="bg-gold/40 h-2.5 w-2.5 rounded-full" />
        <span className="bg-gold/40 h-2.5 w-2.5 rounded-full" />
        <span className="text-muted ml-3 text-[11px] font-medium tracking-wide">
          {label}
        </span>
      </div>

      <div className="p-4">
        <p className="text-muted mb-3 text-xs">{greeting}</p>

        {stats.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="border-beige-border bg-ivory rounded-lg border px-2 py-2"
              >
                <p className="text-navy text-sm leading-none font-semibold">
                  {s.value}
                </p>
                <p className="text-muted mt-1 text-[9px] leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {chart && (
            <div className="border-beige-border bg-ivory flex flex-col items-center justify-center rounded-lg border p-3">
              <div
                className="h-16 w-16 rounded-full"
                style={{
                  background: `conic-gradient(#766242 0% ${chart.percent}%, #E4E4DC ${chart.percent}% 100%)`,
                }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full">
                  <div className="bg-cream flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="text-navy text-[10px] font-semibold">
                      {chart.percent}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-muted mt-2 text-[9px]">{chart.label}</p>
            </div>
          )}

          {list && (
            <div className="border-beige-border bg-ivory rounded-lg border p-3">
              <p className="text-muted mb-2 text-[9px] font-medium">
                {list.title}
              </p>
              <div className="space-y-1.5">
                {list.items.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="bg-gold h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="text-navy/80 truncate text-[9px]">
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
