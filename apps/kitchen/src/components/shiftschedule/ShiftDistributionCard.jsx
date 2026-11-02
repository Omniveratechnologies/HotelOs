const RADIUS = 52;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ShiftDistributionCard = ({
  distribution,
  title = "Shift Distribution Today",
}) => {
  const total = distribution?.total || 0;
  const items = (distribution?.items || []).filter((item) => item.count > 0);
  let offset = 0;

  return (
    <section
      aria-label="Shift distribution"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <svg
            viewBox="0 0 140 140"
            role="img"
            aria-label="Staff per shift"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke="#1f1f1f"
              strokeWidth={STROKE}
            />
            {total > 0 &&
              items.map((item) => {
                const length = (item.count / total) * CIRCUMFERENCE;
                const segment = (
                  <circle
                    key={item.shiftId}
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${Math.max(length - 1.5, 0)} ${CIRCUMFERENCE - Math.max(length - 1.5, 0)}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return segment;
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {distribution ? total : "-"}
            </span>
            <span className="text-[10px] text-gray-500">Total Staff</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2 text-xs">
          {(distribution?.items || []).map((item) => (
            <li
              key={item.shiftId}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-gray-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 text-gray-400">
                {item.count} ({item.percent}%)
              </span>
            </li>
          ))}
          {!distribution && <li className="text-gray-500">Loading...</li>}
        </ul>
      </div>
    </section>
  );
};

export default ShiftDistributionCard;
