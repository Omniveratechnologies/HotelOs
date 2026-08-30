import React from 'react'
import { useRouteError } from 'react-router'

export default function ErrorScreen() {
  const error = useRouteError()
  const message = error?.message

  return (
    <div className="min-h-screen w-full bg-cream-50 flex items-center justify-center p-6">
      <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-lg w-full text-center overflow-hidden">
        {/* Top Accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0f1f3d]" />

        {/* Decorative Blur */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-60" />

        {/* Icon */}
        <div className="relative w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
          😕
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#0f1f3d] font-display mb-3">
          We couldn't open this page
        </h1>

        {/* Description */}
        <p className="text-gray-500 leading-relaxed mb-8">
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
            className="px-6 py-3 bg-[#0f1f3d] text-white font-semibold rounded-xl hover:bg-[#162847] transition-colors"
          >
            Reload Page
          </button>

          <button
            onClick={() => {
              window.location.href = '/'
            }}
            className="px-6 py-3 border border-gray-200 text-[#0f1f3d] font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Go Home
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5 text-left">
          <p className="text-sm font-semibold text-[#0f1f3d] mb-3">
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
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Technical details
            </summary>

            <div className="mt-2 rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-[11px] text-gray-500 break-all font-mono">
                {message}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}