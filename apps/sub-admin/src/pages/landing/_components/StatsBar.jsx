const stats = [
  { value: "500+", label: "Hotels Onboarded" },
  { value: "1M+", label: "Guests Managed" },
  { value: "30%", label: "Increase in Efficiency" },
  { value: "99.9%", label: "System Uptime" },
];

export default function StatsBar() {
  return (
    <section className="bg-navy">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 lg:grid-cols-4 lg:px-10">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-cream mb-1 text-4xl font-semibold">
              {s.value}
            </p>
            <p className="text-cream/60 text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
