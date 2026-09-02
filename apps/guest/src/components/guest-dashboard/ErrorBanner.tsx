import { useGuestDashboard } from "@/context/GuestDashboardContext";

/** Dashboard-level failure notice with an optional retry action. */
export function ErrorBanner() {
  const { failure, runFailureRetry } = useGuestDashboard();
  if (!failure) return null;

  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/10 text-destructive mt-6 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium"
    >
      <span className="min-w-0">{failure.message}</span>
      {failure.retry ? (
        <button
          type="button"
          onClick={runFailureRetry}
          className="focus-visible:ring-ring min-h-11 rounded-full px-3 font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
