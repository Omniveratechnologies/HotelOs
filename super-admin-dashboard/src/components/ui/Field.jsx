export default function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-body">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-500">{error}</span>}
    </label>
  );
}

export function inputClass(hasError) {
  return `w-full rounded-lg border ${
    hasError ? "border-rose-500" : "border-line"
  } bg-white px-3.5 py-2.5 text-sm text-ink-body placeholder:text-ink-muted/60 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/15`;
}
