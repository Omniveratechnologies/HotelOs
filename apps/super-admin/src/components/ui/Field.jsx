export default function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-brand-900 mb-1.5 block text-sm font-semibold">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="text-brand-700/60 mt-1.5 block text-xs">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-rose-500">
          {error}
        </span>
      )}
    </label>
  );
}
