const stats = [
  { value: "500+", label: "Hotels Onboarded" },
  { value: "1M+", label: "Guests Managed" },
  { value: "30%", label: "Increase in Efficiency" },
  { value: "99.9%", label: "System Uptime" },
];

export default function StatsBar() {
  return (
    <section className="bg-navy">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-4xl font-semibold text-cream mb-1">{s.value}</p>
            <p className="text-sm text-cream/60">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
