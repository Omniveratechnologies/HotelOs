export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="border-surface-200 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/60 px-6 py-16 text-center">
      {Icon && (
        <div className="bg-brand-950/5 text-brand-700/60 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
      <p className="font-display text-brand-900 text-base font-bold">{title}</p>
      {description && (
        <p className="text-brand-700/60 mt-1.5 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white">
      <div className="divide-surface-200 divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            // oxlint-disable-next-line react/no-array-index-key -- skeleton rows are purely decorative placeholders with no data identity
            key={`row-${r}`}
            className="flex items-center gap-4 px-5 py-4"
          >
            {Array.from({ length: cols }).map((__, c) => (
              <div
                // oxlint-disable-next-line react/no-array-index-key -- skeleton columns are decorative placeholders with no data identity
                key={`col-${c}`}
                className="bg-brand-950/5 h-3.5 flex-1 animate-pulse rounded"
                style={{ maxWidth: c === 0 ? "180px" : "120px" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
