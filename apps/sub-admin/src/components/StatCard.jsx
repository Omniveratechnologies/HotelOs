export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="border-beige-border bg-cream text-navy shadow-card rounded-2xl border p-5">
      <div className="mb-4 flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${"bg-gold/10"}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={"#766242"}
            strokeWidth="1.6"
          >
            {icon}
          </svg>
        </span>
      </div>
      <p className={`font-display text-2xl font-semibold ${"text-navy"}`}>
        {value}
      </p>
      <p className={`mt-1 text-sm ${"text-muted"}`}>{label}</p>
      {sub && <p className={`mt-2 text-xs ${"text-gold"}`}>{sub}</p>}
    </div>
  );
}
