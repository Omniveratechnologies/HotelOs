import { FiEye } from "react-icons/fi";
import ActionButton from "../ui/button/ActionButton.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import {
  formatRange,
  REPORT_META,
} from "../../utils/exportReport.constants.js";

const EMPTY_ARRAY = [];

const statusKey = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const ReportPreview = ({
  type,
  range,
  columns = EMPTY_ARRAY,
  rows = EMPTY_ARRAY,
  total = 0,
  limit = 10,
  loading = false,
  error = "",
  onPreview,
}) => {
  const title = REPORT_META[type]?.label || "Report";
  const rangeText = formatRange(range);

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b1117] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiEye size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Report Preview</h3>
        </div>

        <ActionButton
          variant="outline"
          icon={<FiEye size={13} />}
          onClick={onPreview}
          disabled={loading}
        >
          {loading ? "Loading..." : `Preview (First ${limit} records)`}
        </ActionButton>
      </div>

      <div className="mb-3 border-l-2 border-emerald-500 pl-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        {rangeText && <p className="text-[11px] text-gray-500">{rangeText}</p>}
      </div>

      {error ? (
        <p role="alert" className="py-10 text-center text-xs text-red-400">
          {error}
        </p>
      ) : loading ? (
        <p className="py-10 text-center text-xs text-gray-500">
          Loading preview...
        </p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-xs text-gray-500">
          Choose your filters and click Preview to see the records.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="px-2 py-2 font-medium">#</th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-2 py-2 font-medium whitespace-nowrap"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800/60 text-gray-300"
                  >
                    <td className="px-2 py-2.5 text-gray-500">{index + 1}</td>

                    {columns.map((column) => {
                      const value = row[column.key];

                      return (
                        <td
                          key={column.key}
                          className="px-2 py-2.5 whitespace-nowrap"
                        >
                          {column.key === "status" && value ? (
                            <StatusBadge status={statusKey(value)} />
                          ) : value === "" || value == null ? (
                            <span className="text-gray-600">-</span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-gray-500">
            Showing {rows.length} of {total} records
          </p>
        </>
      )}
    </section>
  );
};

export default ReportPreview;
