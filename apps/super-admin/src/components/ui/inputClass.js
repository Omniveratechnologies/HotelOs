export function inputClass(hasError) {
  return `w-full rounded-lg border ${
    hasError ? "border-rose-500" : "border-surface-200"
  } bg-white px-3.5 py-2.5 text-sm text-brand-900 placeholder:text-brand-700/40 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15`;
}
