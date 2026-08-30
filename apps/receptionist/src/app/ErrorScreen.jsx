import React from "react";
import { useRouteError } from "react-router";

export default function ErrorScreen() {
  const error = useRouteError();
  const message = error?.message;

  return (
    <div className="bg-cream-50 flex min-h-screen w-full items-center justify-center p-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xs">
        {/* Top Accent */}
        <div className="bg-navy-900 absolute inset-x-0 top-0 h-1" />

        {/* Decorative Blur */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-red-50 opacity-60 blur-3xl" />

        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
          😕
        </div>

        {/* Title */}
        <h1 className="font-display text-navy-900 mb-3 text-3xl font-bold">
          We couldn't open this page
        </h1>

        {/* Description */}
        <p className="mb-8 leading-relaxed text-gray-500">
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
            className="bg-navy-900 hover:bg-navy-800 rounded-xl px-6 py-3 font-semibold text-white transition-colors"
          >
            Reload Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="text-navy-900 rounded-xl border border-gray-200 px-6 py-3 font-semibold transition-colors hover:bg-gray-50"
          >
            Go Home
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left">
          <p className="text-navy-900 mb-3 text-sm font-semibold">
            Still having trouble?
          </p>

          <ul className="space-y-2 text-sm text-gray-500">
            <li>• Check that you're connected to the internet</li>
            <li>• Close and reopen the app or browser tab</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>

        {/* Technical Details (Hidden by Default) */}
        {message && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-400 transition-colors hover:text-gray-600">
              Technical details
            </summary>

            <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="font-mono text-[11px] break-all text-gray-500">
                {message}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
