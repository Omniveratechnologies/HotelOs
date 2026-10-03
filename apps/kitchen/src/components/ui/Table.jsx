const EMPTY_ARRAY = [];

const Table = ({
  columns = EMPTY_ARRAY,
  data = EMPTY_ARRAY,
  emptyMessage = "No data available",
  onRowClick,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px] text-left">
        <thead>
          <tr className="border-b border-gray-800 bg-[#0f0f0f]">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-center text-[15px] tracking-wide text-gray-500 uppercase"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr
                key={row._id || row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-800/70 text-center text-[13px] transition hover:bg-[#151515] ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-gray-300"

                    onClick={
                      column.key === "actions"
                        ? (e) => e.stopPropagation()
                        : undefined
                    }
                  >
                    {column.render
                      ? column.render(row, rowIndex)
                      : (row[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-xs text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
