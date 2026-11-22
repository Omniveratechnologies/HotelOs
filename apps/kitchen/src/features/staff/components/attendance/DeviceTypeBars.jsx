import { TYPE_OPTIONS } from "../../utils/deviceFormat.js";

const DeviceTypeBars = ({ stats }) => (
  <section
    aria-label="Device types"
    className="rounded-xl border border-gray-800 bg-[#111111] p-4"
  >
    <h2 className="mb-3 text-sm font-semibold text-white">Device Types</h2>

    <ul className="space-y-3">
      {TYPE_OPTIONS.map((type) => {
        const count = stats?.types?.[type.value] ?? 0;
        const share = stats?.total
          ? Math.round((count / stats.total) * 100)
          : 0;

        return (
          <li key={type.value}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-gray-300">{type.label}</span>
              <span className="text-gray-400">
                {stats ? `${count} (${share}%)` : "-"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${share}%`, backgroundColor: type.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  </section>
);

export default DeviceTypeBars;
