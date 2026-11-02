import {
  STATUS_COLOR,
  STATUS_LABEL,
  percentText,
} from "../../utils/dailyreportUtils.js";

const R = 62;
const C = 2 * Math.PI * R;

const AttendanceOverviewCard = ({ overview }) => {
  const series = (overview?.series || []).filter((slice) => slice.count > 0);
  const sum = series.reduce((a, s) => a + s.count, 0);
  let offset = 0;

  return (
    <section
      aria-label="Attendance overview"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Attendance Overview
      </h2>

      <div className="flex flex-wrap items-center gap-5">
        <svg
          viewBox="0 0 160 160"
          className="h-36 w-36 shrink-0"
          role="img"
          aria-label={`Attendance split of ${overview?.total ?? 0} staff`}
        >
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke="#1f1f1f"
            strokeWidth="20"
          />
          {sum > 0 &&
            series.map((slice) => {
              const length = (slice.count / sum) * C;
              const node = (
                <circle
                  key={slice.status}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={STATUS_COLOR[slice.status] || "#9ca3af"}
                  strokeWidth="20"
                  strokeDasharray={`${Math.max(length - 1, 0)} ${C}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                />
              );
              offset += length;
              return node;
            })}
          <text
            x="80"
            y="82"
            textAnchor="middle"
            className="fill-white text-[26px] font-bold"
          >
            {overview?.total ?? "-"}
          </text>
          <text
            x="80"
            y="98"
            textAnchor="middle"
            className="fill-gray-400 text-[9px]"
          >
            Total Staff
          </text>
        </svg>

        <ul className="min-w-[140px] flex-1 space-y-2 text-xs">
          {(overview?.series || []).map((slice) => (
            <li
              key={slice.status}
              className="flex items-center gap-2 text-gray-300"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: STATUS_COLOR[slice.status] || "#9ca3af",
                }}
              />
              <span className="flex-1">
                {STATUS_LABEL[slice.status] || slice.status}
              </span>
              <span className="text-gray-400">
                {slice.count} ({percentText(slice.percent)})
              </span>
            </li>
          ))}
          {!overview && <li className="text-gray-500">Loading...</li>}
        </ul>
      </div>
    </section>
  );
};

export default AttendanceOverviewCard;
