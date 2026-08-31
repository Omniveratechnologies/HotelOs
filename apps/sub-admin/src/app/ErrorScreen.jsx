import React from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorScreen() {
  const error = useRouteError();
  const message = error?.message;

  return (
    <div className="bg-ivory font-body flex min-h-screen w-full items-center justify-center p-6">
      <div className="border-beige-border bg-cream shadow-soft relative w-full max-w-lg overflow-hidden rounded-3xl border p-10 text-center">
        {/* Top Accent */}
        <div className="bg-navy absolute inset-x-0 top-0 h-1" />

        {/* Decorative Blur */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-red-50 opacity-60 blur-3xl" />

        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
          😕
        </div>

        {/* Title */}
        <h1 className="font-display text-navy mb-3 text-3xl font-bold">
          We couldn't open this page
        </h1>

        {/* Description */}
        <p className="text-navy/60 mb-8 leading-relaxed">
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
            className="bg-navy text-cream hover:bg-navy-dark rounded-xl px-6 py-3 font-semibold transition-colors"
          >
            Reload Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="border-beige-border text-navy hover:bg-ivory rounded-xl border px-6 py-3 font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>

        {/* Help Section */}
        <div className="border-beige-border bg-ivory mt-8 rounded-2xl border p-5 text-left">
          <p className="text-navy mb-3 text-sm font-semibold">
            Still having trouble?
          </p>

          <ul className="text-navy/60 space-y-2 text-sm">
            <li>• Check that you're connected to the internet</li>
            <li>• Close and reopen the app or browser tab</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>

        {/* Technical Details (Hidden by Default) */}
        {message && (
          <details className="mt-6 text-left">
            <summary className="text-muted hover:text-navy cursor-pointer text-xs transition-colors">
              Technical details
            </summary>

            <div className="border-beige-border bg-ivory mt-2 rounded-xl border p-3">
              <p className="text-navy/60 font-mono text-[11px] break-all">
                {message}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
