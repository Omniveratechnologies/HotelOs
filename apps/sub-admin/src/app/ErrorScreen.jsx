import React from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorScreen() {
  const error = useRouteError();
  const message = error?.message;

  return (
    <div className="min-h-screen w-full bg-ivory flex items-center justify-center p-6 font-body">
      <div className="relative bg-cream rounded-3xl border border-beige-border shadow-soft p-10 max-w-lg w-full text-center overflow-hidden">
        {/* Top Accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-navy" />

        {/* Decorative Blur */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-60" />

        {/* Icon */}
        <div className="relative w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
          😕
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-navy font-display mb-3">
          We couldn't open this page
        </h1>

        {/* Description */}
        <p className="text-navy/60 leading-relaxed mb-8">
          Something unexpected happened while loading this page.
          <br />
          Don't worry — your information is safe.
          <br />
          Please try again using one of the options below.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-navy text-cream font-semibold rounded-xl hover:bg-navy-dark transition-colors"
          >
            Reload Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="px-6 py-3 border border-beige-border text-navy font-semibold rounded-xl hover:bg-ivory transition-colors"
          >
            Go Home
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-2xl bg-ivory border border-beige-border p-5 text-left">
          <p className="text-sm font-semibold text-navy mb-3">
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
            <summary className="cursor-pointer text-xs text-muted hover:text-navy transition-colors">
              Technical details
            </summary>

            <div className="mt-2 rounded-xl bg-ivory border border-beige-border p-3">
              <p className="text-[11px] text-navy/60 break-all font-mono">
                {message}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}