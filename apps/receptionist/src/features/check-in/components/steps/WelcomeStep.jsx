import { Phone, Timer, ShieldCheck, Zap } from "lucide-react";

/** Step 1 — Welcome: brand mark, tagline, feature bullets, Start CTA. */
export function WelcomeStep({ hotelName, onStart }) {
  return (
    <div className="text-center">
      <p className="text-brand-700 text-xs font-semibold tracking-[0.2em] uppercase">
        {hotelName}
      </p>
      <h1 className="text-brand-900 mt-2 text-3xl font-bold">Self Check-in</h1>
      <p className="text-primary-600 mt-1 text-sm font-semibold">
        Quick · Easy · Secure
      </p>

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[
          { icon: Timer, label: "No Waiting" },
          { icon: ShieldCheck, label: "Secure & Safe" },
          { icon: Zap, label: "3–5 minutes" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span className="bg-primary-50 text-primary-600 flex h-12 w-12 items-center justify-center rounded-full">
              <Icon size={20} />
            </span>
            <span className="text-surface-600 text-xs">{label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="bg-primary-500 hover:bg-primary-600 text-brand-900 mt-8 w-full rounded-xl py-3.5 text-sm font-bold transition-colors"
      >
        Start Check-in →
      </button>

      <a
        href="tel:+911800000000"
        className="text-surface-500 mt-4 inline-flex items-center gap-1.5 text-xs"
      >
        <Phone size={12} /> Need help? Call reception
      </a>
    </div>
  );
}

export default WelcomeStep;
