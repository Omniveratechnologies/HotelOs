import { Icon } from "./MarketingIcons.jsx";

/**
 * Comparison table.
 *
 * Props
 *  title, subtitle   heading above the table
 *  columns           [{ title, note, kind }]   kind: "fixed" | "custom"
 *  rows              [{ label, values }]       one value per column:
 *                      true  = tick, false = dash, a string = text
 */
export default function ComparisonTable({
  title,
  subtitle,
  columns = [],
  rows = [],
}) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <h2 className="text-brand-900 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="text-brand-700/80 mt-2 text-sm">{subtitle}</p>}

      <div className="border-surface-200 mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-surface-200 bg-background-100/60 border-b">
              <th
                scope="col"
                className="text-brand-900 px-5 py-4 text-left text-sm font-bold"
              >
                Feature
              </th>
              {columns.map((column) => (
                <th
                  key={column.title}
                  scope="col"
                  className="border-surface-200 border-l px-5 py-4 text-center"
                >
                  <span className="text-brand-900 block text-sm font-bold">
                    {column.title}
                  </span>{" "}
                  <span
                    className={`block text-xs font-medium ${
                      column.kind === "custom"
                        ? "text-rose-600"
                        : "text-brand-700/70"
                    }`}
                  >
                    {column.note}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-surface-200 border-b last:border-b-0"
              >
                <th
                  scope="row"
                  className="text-brand-800 px-5 py-3.5 text-left text-sm font-medium"
                >
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={`${row.label}-${columns[index]?.title}`}
                    className="border-surface-200 text-brand-800 border-l px-5 py-3.5 text-center"
                  >
                    {value === true ? (
                      <span
                        className={`inline-flex ${
                          columns[index]?.kind === "custom"
                            ? "text-[#e0932b]"
                            : "text-brand-900"
                        }`}
                      >
                        <Icon name="check" className="h-5 w-5" />
                        <span className="sr-only">Included</span>
                      </span>
                    ) : value === false ? (
                      <span className="text-brand-700/50">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">Not included</span>
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
