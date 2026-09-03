export default function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-ink-body mb-1.5 block text-sm font-semibold">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="text-ink-muted mt-1.5 block text-xs">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-rose-500">
          {error}
        </span>
      )}
    </label>
  );
}
