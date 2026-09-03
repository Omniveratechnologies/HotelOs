export function inputClass(hasError) {
  return `w-full rounded-lg border ${
    hasError ? "border-rose-500" : "border-line"
  } bg-white px-3.5 py-2.5 text-sm text-ink-body placeholder:text-ink-muted/60 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/15`;
}
