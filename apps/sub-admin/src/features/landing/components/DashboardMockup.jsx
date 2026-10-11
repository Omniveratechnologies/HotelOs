export default function DashboardMockup({
  label = "Front Desk",
  greeting = "Welcome back, Aria",
  stats,
  chart = null,
  list = null,
  className = "",
}) {
  const displayStats = stats ?? [];
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md ${className}`}
    >
      {/* window chrome */}
      <div className="bg-background-50/60 flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <span className="bg-primary-400/40 h-2.5 w-2.5 rounded-full" />
        <span className="bg-primary-400/40 h-2.5 w-2.5 rounded-full" />
        <span className="bg-primary-400/40 h-2.5 w-2.5 rounded-full" />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-gray-500">
          {label}
        </span>
      </div>

      <div className="p-4">
        <p className="mb-3 text-xs text-gray-500">{greeting}</p>

        {displayStats.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {displayStats.map((s) => (
              <div
                key={s.label}
                className="bg-background-50 rounded-lg border border-gray-200 px-2 py-2"
              >
                <p className="text-brand-900 text-sm leading-none font-semibold">
                  {s.value}
                </p>
                <p className="mt-1 text-[9px] leading-tight text-gray-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {chart && (
            <div className="bg-background-50 flex flex-col items-center justify-center rounded-lg border border-gray-200 p-3">
              <div
                className="h-16 w-16 rounded-full"
                style={{
                  background: `conic-gradient(var(--color-primary-400) 0% ${chart.percent}%, var(--color-surface-200) ${chart.percent}% 100%)`,
                }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                    <span className="text-brand-900 text-[10px] font-semibold">
                      {chart.percent}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[9px] text-gray-500">{chart.label}</p>
            </div>
          )}

          {list && (
            <div className="bg-background-50 rounded-lg border border-gray-200 p-3">
              <p className="mb-2 text-[9px] font-medium text-gray-500">
                {list.title}
              </p>
              <div className="space-y-1.5">
                {list.items.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="bg-primary-400 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="text-brand-900/80 truncate text-[9px]">
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
