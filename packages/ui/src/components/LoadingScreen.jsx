/**
 * Full-viewport branded loading spinner.
 * @returns {import("react").ReactElement}
 */
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-brand-900 h-8 w-8 animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-20"
        />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
