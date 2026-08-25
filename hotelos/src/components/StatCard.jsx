export default function StatCard({ label, value, sub, icon, tone = "default" }) {
  const toneClasses =
    tone === "gold"
      ? "bg-navy text-cream"
      : "bg-cream text-navy border border-beige-border";

  return (
    <div className={`rounded-2xl p-5 shadow-card ${toneClasses}`}>
      <div className="flex items-start justify-between mb-4">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            tone === "gold" ? "bg-cream/10" : "bg-gold/10"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone === "gold" ? "#F4F4E4" : "#766242"} strokeWidth="1.6">
            {icon}
          </svg>
        </span>
      </div>
      <p className={`text-2xl font-display font-semibold ${tone === "gold" ? "text-cream" : "text-navy"}`}>
        {value}
      </p>
      <p className={`text-sm mt-1 ${tone === "gold" ? "text-cream/60" : "text-muted"}`}>{label}</p>
      {sub && (
        <p className={`text-xs mt-2 ${tone === "gold" ? "text-gold" : "text-gold"}`}>{sub}</p>
      )}
    </div>
  );
}
