const Table = ({
  columns = [],
  data = [],
  emptyMessage = "No data available",
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px] text-left">
        <thead>
          <tr className="border-b border-gray-800 bg-[#0f0f0f]">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-[11px] font-medium tracking-wide text-gray-500 uppercase"
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
                className="border-b border-gray-800/70 transition hover:bg-[#151515]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-xs text-gray-300"
                  >
                    {column.render
                      ? column.render(row)
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
