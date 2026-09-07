import React from "react";

export function NotFound() {
  return (
    <div className="bg-background-50 flex min-h-screen w-full items-center justify-center p-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-md">
        {/* Top Accent */}
        <div className="bg-brand-900 absolute inset-x-0 top-0 h-1" />

        {/* Decorative Blur */}
        <div className="bg-primary-100 absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-60 blur-3xl" />

        {/* 404 */}
        <div className="font-display text-brand-900 relative mb-2 text-6xl font-bold">
          404
        </div>

        {/* Title */}
        <h1 className="font-display text-brand-900 mb-3 text-3xl font-bold">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-brand-900/60 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          <br />
          Check the address for typos, or use one of the options below.
        </p>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-brand-900 hover:bg-brand-800 rounded-xl px-6 py-3 font-semibold text-white transition-colors"
          >
            Go Home
          </button>

          <button
            onClick={() => window.history.back()}
            className="text-brand-900 rounded-xl border border-gray-200 px-6 py-3 font-semibold transition-colors hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
