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
    <section id="pricing" className="bg-ivory py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="mb-3 font-display text-4xl font-semibold text-navy">
            Simple, Transparent Pricing
          </h2>
          <p className="text-navy/60">
            Choose the plan that fits the size and pace of your property.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-8 ${
                p.featured
                  ? "scale-[1.02] border-navy bg-navy text-cream shadow-soft"
                  : "border-beige-border bg-cream text-navy"
              }`}
            >
              <p
                className={`mb-2 text-sm font-medium ${p.featured ? "text-gold" : "text-gold"}`}
              >
                {p.name}
              </p>
              <div className="mb-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">
                  {p.price}
                </span>
                <span
                  className={
                    p.featured ? "text-sm text-cream/50" : "text-sm text-muted"
                  }
                >
                  {p.period}
                </span>
              </div>
              <p
                className={`mb-6 text-sm ${p.featured ? "text-cream/60" : "text-navy/60"}`}
              >
                {p.desc}
              </p>
              <ul className="mb-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l4 4 10-10"
                        stroke={p.featured ? "#F4F4E4" : "#766242"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      className={p.featured ? "text-cream/80" : "text-navy/70"}
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
                    ? "bg-gold text-cream hover:bg-gold-hover"
                    : "border border-beige-border text-navy hover:border-gold hover:text-gold"
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
