import React from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorScreen() {
  const error = useRouteError();
  const message = error?.message;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-ivory p-6 font-body">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-beige-border bg-cream p-10 text-center shadow-soft">
        {/* Top Accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-navy" />

        {/* Decorative Blur */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-red-50 opacity-60 blur-3xl" />

        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
          😕
        </div>

        {/* Title */}
        <h1 className="mb-3 font-display text-3xl font-bold text-navy">
          We couldn't open this page
        </h1>

        {/* Description */}
        <p className="mb-8 leading-relaxed text-navy/60">
          Something unexpected happened while loading this page.
          <br />
          Don't worry — your information is safe.
          <br />
          Please try again using one of the options below.
        </p>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-navy px-6 py-3 font-semibold text-cream transition-colors hover:bg-navy-dark"
          >
            Reload Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="rounded-xl border border-beige-border px-6 py-3 font-semibold text-navy transition-colors hover:bg-ivory"
          >
            Go Home
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-2xl border border-beige-border bg-ivory p-5 text-left">
          <p className="mb-3 text-sm font-semibold text-navy">
            Still having trouble?
          </p>

          <ul className="space-y-2 text-sm text-navy/60">
            <li>• Check that you're connected to the internet</li>
            <li>• Close and reopen the app or browser tab</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>

        {/* Technical Details (Hidden by Default) */}
        {message && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-muted transition-colors hover:text-navy">
              Technical details
            </summary>

            <div className="mt-2 rounded-xl border border-beige-border bg-ivory p-3">
              <p className="break-all font-mono text-[11px] text-navy/60">
                {message}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
