export function Input({ label, error, ...props }) {
  return (
    <div className="mb-4">
      <label
        htmlFor={props.name}
        className="text-brand-900 mb-2 block text-sm font-medium"
      >
        {label}
      </label>
      <input
        id={props.name}
        className={`text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2 ${error ? "border-red-500" : ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
