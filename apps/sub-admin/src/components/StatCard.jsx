export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="rounded-2xl p-5 shadow-card bg-cream text-navy border border-beige-border">
      <div className="flex items-start justify-between mb-4">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center ${"bg-gold/10"}`}>
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
      <p className={`text-2xl font-display font-semibold ${"text-navy"}`}>{value}</p>
      <p className={`text-sm mt-1 ${"text-muted"}`}>{label}</p>
      {sub && <p className={`text-xs mt-2 ${"text-gold"}`}>{sub}</p>}
    </div>
  );
}
