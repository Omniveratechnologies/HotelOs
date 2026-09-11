export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="text-brand-900 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between">
        <span className="bg-primary-400/10 text-primary-400 flex h-10 w-10 items-center justify-center rounded-full">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            {icon}
          </svg>
        </span>
      </div>
      <p className="font-display text-brand-900 text-2xl font-semibold">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
      {sub && <p className="text-primary-400 mt-2 text-xs">{sub}</p>}
    </div>
  );
}
