import { cn } from "@hotelos/utils";
import { EmptyState } from "./EmptyState.jsx";

/**
 * Standard card-wrapped data table.
 *
 * @param {Object} props
 * @param {string} [props.title] - Optional table card header title
 * @param {string} [props.description] - Optional table card description
 * @param {React.ReactNode} [props.actions] - Optional header right actions slot
 * @param {Array<{ label: string, key: string, render?: (row: any, index: number) => React.ReactNode, className?: string }>} props.columns - Column configurations
 * @param {Array<any>} [props.data=[]] - Data rows (alias: rows)
 * @param {Array<any>} [props.rows] - Data rows alias
 * @param {(row: any, index: number) => void} [props.onRowClick] - Click handler for rows
 * @param {boolean} [props.loading=false] - Whether table is in loading state
 * @param {string} [props.emptyTitle='No records found'] - Title for empty state
 * @param {string} [props.emptyDescription='There are no items to display in this list.'] - Description for empty state
 * @param {string} [props.className=''] - Additional container classes
 * @returns {React.ReactElement}
 */
export function DataTable({
  title,
  description,
  actions,
  columns = [],
  data,
  rows,
  onRowClick,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no items to display in this list.",
  className = "",
}) {
  const tableRows = data || rows || [];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="font-display text-brand-900 text-sm font-semibold">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-gray-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Loading data...
        </div>
      ) : tableRows.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                {columns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    className={cn("px-6 py-3.5", col.className)}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((row, rowIdx) => {
                const rowKey = row.id || row._id || rowIdx;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row, rowIdx)}
                    className={cn(
                      "transition-colors",
                      onRowClick
                        ? "cursor-pointer hover:bg-blue-50/40"
                        : "hover:bg-gray-50/50",
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.key || colIdx}
                        className={cn(
                          "px-6 py-3.5 text-gray-700",
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row, rowIdx)
                          : row[col.key] != null
                            ? String(row[col.key])
                            : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DataTable;
