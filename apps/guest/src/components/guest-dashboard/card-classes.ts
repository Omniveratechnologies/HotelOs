/** Centered modal on desktop, full-width bottom sheet on mobile. */
export const SHEET_CONTENT =
  "flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 " +
  "max-sm:left-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-[92dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:border-x-0 max-sm:border-b-0";

/** Shared shape for the large tappable service cards. */
export const SERVICE_CARD_BASE =
  "group flex min-h-[9.5rem] flex-col justify-between rounded-3xl p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60";
