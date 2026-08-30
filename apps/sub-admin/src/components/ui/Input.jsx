export function Input({ label, error, ...props }) {
  return (
    <div className="mb-4">
      <label
        htmlFor={props.name}
        className="text-navy mb-2 block text-sm font-medium"
      >
        {label}
      </label>
      <input
        id={props.name}
        className={`border-beige-border text-navy focus:ring-gold w-full rounded-lg border bg-white px-4 py-3 outline-hidden focus:ring-2 ${error ? "border-rose-500" : ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
