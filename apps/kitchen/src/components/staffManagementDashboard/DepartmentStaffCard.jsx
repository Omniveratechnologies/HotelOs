import { formatNumber } from "../../utils/dashboardUtils.js";

const R = 62;
const C = 2 * Math.PI * R;
const OTHERS = "#6b7280";
const DepartmentStaffCard = ({ departmentStaff }) => {
  const slices = [
    ...(departmentStaff?.departments || []).map((d) => ({
      key: d._id || d.name,
      name: d.name,
      color: d.color,
      count: d.count,
    })),
    ...(departmentStaff?.others
      ? [
          {
            key: "others",
            name: "Others",
            color: OTHERS,
            count: departmentStaff.others,
          },
        ]
      : []),
  ];
  const sum = slices.reduce((a, s) => a + s.count, 0);
  let offset = 0;

  return (
    <section
      aria-label="Department wise staff"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Department-wise Staff
      </h2>

      <div className="flex flex-wrap items-center gap-4">
        <svg
          viewBox="0 0 160 160"
          className="h-36 w-36 shrink-0"
          role="img"
          aria-label={`${departmentStaff?.total ?? 0} staff across departments`}
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
            slices.map((slice) => {
              const length = (slice.count / sum) * C;
              const node = (
                <circle
                  key={slice.key}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={slice.color}
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
            className="fill-white text-[24px] font-bold"
          >
            {departmentStaff ? formatNumber(departmentStaff.total) : "-"}
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

        <ul className="min-w-[120px] flex-1 space-y-1.5 text-[11px]">
          {slices.map((slice) => (
            <li
              key={slice.key}
              className="flex items-center gap-2 text-gray-300"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 truncate" title={slice.name}>
                {slice.name}
              </span>
              <span className="text-gray-400">{formatNumber(slice.count)}</span>
            </li>
          ))}
          {departmentStaff && !slices.length && (
            <li className="text-gray-500">No active staff.</li>
          )}
          {!departmentStaff && <li className="text-gray-500">Loading...</li>}
        </ul>
      </div>
    </section>
  );
};

export default DepartmentStaffCard;
