const plans = [
  {
    name: "Boutique",
    price: "$149",
    period: "/month",
    desc: "For independent hotels up to 40 rooms.",
    features: ["Front desk & reservations", "Housekeeping tracking", "Email support"],
  },
  {
    name: "Estate",
    price: "$399",
    period: "/month",
    desc: "For growing properties up to 150 rooms.",
    features: ["Everything in Boutique", "AI assistant included", "Revenue insights", "Priority support"],
    featured: true,
  },
  {
    name: "Group",
    price: "Custom",
    period: "",
    desc: "For multi-property hotel groups.",
    features: ["Everything in Estate", "Multi-property dashboard", "Dedicated success manager"],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-display text-4xl font-semibold text-navy mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-navy/60">Choose the plan that fits the size and pace of your property.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-8 border ${
                p.featured
                  ? "bg-navy border-navy text-cream shadow-soft scale-[1.02]"
                  : "bg-cream border-beige-border text-navy"
              }`}
            >
              <p className={`text-sm font-medium mb-2 ${p.featured ? "text-gold" : "text-gold"}`}>
                {p.name}
              </p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className={p.featured ? "text-cream/50 text-sm" : "text-muted text-sm"}>
                  {p.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${p.featured ? "text-cream/60" : "text-navy/60"}`}>
                {p.desc}
              </p>
              <ul className="space-y-3 mb-8">
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
                    <span className={p.featured ? "text-cream/80" : "text-navy/70"}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                className={`block text-center font-medium rounded-full px-5 py-3 transition-colors ${
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
