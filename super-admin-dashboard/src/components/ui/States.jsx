export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-950/5 text-ink-muted">
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
      <p className="font-display text-base font-bold text-ink-body">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((__, c) => (
              <div
                key={c}
                className="h-3.5 flex-1 animate-pulse rounded bg-ink-950/5"
                style={{ maxWidth: c === 0 ? "180px" : "120px" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
