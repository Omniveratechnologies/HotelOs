export function Input({ label, error, ...props }) {
  return (
    <div className="mb-4">
      <label htmlFor={props.name} className="block text-sm font-medium text-navy mb-2">
        {label}
      </label>
      <input
        id={props.name}
        className={`w-full rounded-lg border border-beige-border bg-white px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-gold ${error ? "border-rose-500" : ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
