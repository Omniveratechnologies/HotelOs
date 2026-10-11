const plans = [
  {
    name: "Boutique",
    price: "$149",
    period: "/month",
    desc: "For independent hotels up to 40 rooms.",
    features: [
      "Front desk & reservations",
      "Housekeeping tracking",
      "Email support",
    ],
  },
  {
    name: "Estate",
    price: "$399",
    period: "/month",
    desc: "For growing properties up to 150 rooms.",
    features: [
      "Everything in Boutique",
      "AI assistant included",
      "Revenue insights",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Group",
    price: "Custom",
    period: "",
    desc: "For multi-property hotel groups.",
    features: [
      "Everything in Estate",
      "Multi-property dashboard",
      "Dedicated success manager",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-background-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="font-display text-brand-900 mb-3 text-4xl font-semibold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-brand-900/60">
            Choose the plan that fits the size and pace of your property.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-8 ${
                p.featured
                  ? "border-brand-900 bg-brand-900 scale-[1.02] text-white shadow-md"
                  : "text-brand-900 border-gray-100 bg-white"
              }`}
            >
              <p className="text-primary-400 mb-2 text-sm font-medium">
                {p.name}
              </p>
              <div className="mb-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">
                  {p.price}
                </span>
                <span
                  className={
                    p.featured
                      ? "text-sm text-white/50"
                      : "text-sm text-gray-500"
                  }
                >
                  {p.period}
                </span>
              </div>
              <p
                className={`mb-6 text-sm ${p.featured ? "text-white/60" : "text-brand-900/60"}`}
              >
                {p.desc}
              </p>
              <ul className="mb-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l4 4 10-10"
                        stroke={
                          p.featured
                            ? "var(--color-surface-50)"
                            : "var(--color-primary-400)"
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      className={
                        p.featured ? "text-white/80" : "text-brand-900/70"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                className={`block rounded-full px-5 py-3 text-center font-medium transition-colors ${
                  p.featured
                    ? "bg-primary-400 hover:bg-primary-500 text-white"
                    : "text-brand-900 hover:border-primary-400 hover:text-primary-400 border border-gray-200"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
