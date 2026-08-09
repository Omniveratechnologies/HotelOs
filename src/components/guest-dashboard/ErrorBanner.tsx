import { useGuestDashboard } from "@/context/GuestDashboardContext";

/** Dashboard-level failure notice with an optional retry action. */
export function ErrorBanner() {
  const { failure, runFailureRetry } = useGuestDashboard();
  if (!failure) return null;

  return (
    <div
      role="alert"
      className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive"
    >
      <span className="min-w-0">{failure.message}</span>
      {failure.retry ? (
        <button
          type="button"
          onClick={runFailureRetry}
          className="min-h-11 rounded-full px-3 font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
