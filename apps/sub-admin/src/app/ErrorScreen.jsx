import React from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorScreen() {
  const error = useRouteError();
  const message = error?.message;

  return (
    <div className="bg-background-50 flex min-h-screen w-full items-center justify-center p-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-md">
        {/* Top Accent */}
        <div className="bg-brand-900 absolute inset-x-0 top-0 h-1" />

        {/* Decorative Blur */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-red-50 opacity-60 blur-3xl" />

        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
          😕
        </div>

        {/* Title */}
        <h1 className="font-display text-brand-900 mb-3 text-3xl font-bold">
          We couldn't open this page
        </h1>

        {/* Description */}
        <p className="text-brand-900/60 mb-8 leading-relaxed">
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
            className="bg-brand-900 hover:bg-brand-800 rounded-xl px-6 py-3 font-semibold text-white transition-colors"
          >
            Reload Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="text-brand-900 rounded-xl border border-gray-200 px-6 py-3 font-semibold transition-colors hover:bg-gray-50"
          >
            Go Home
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-background-50 mt-8 rounded-2xl border border-gray-100 p-5 text-left">
          <p className="text-brand-900 mb-3 text-sm font-semibold">
            Still having trouble?
          </p>

          <ul className="text-brand-900/60 space-y-2 text-sm">
            <li>• Check that you're connected to the internet</li>
            <li>• Close and reopen the app or browser tab</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>

        {/* Technical Details (Hidden by Default) */}
        {message && (
          <details className="mt-6 text-left">
            <summary className="hover:text-brand-900 cursor-pointer text-xs text-gray-500 transition-colors">
              Technical details
            </summary>

            <div className="bg-background-50 mt-2 rounded-xl border border-gray-100 p-3">
              <p className="text-brand-900/60 font-mono text-[11px] break-all">
                {message}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
