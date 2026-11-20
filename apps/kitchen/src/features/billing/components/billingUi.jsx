import { X } from "lucide-react";
import { EMPTY_OBJECT } from "@/constants/defaults.js";

export function Page({ title, action, children }) {
  return (
    <main className="min-h-full space-y-5 bg-[#07131f] p-4 text-slate-100 md:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[.22em] text-emerald-400 uppercase">
            Billing
          </p>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
export function Notice({ text, onClose }) {
  return text ? (
    <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      {text}
      <button onClick={onClose} title="Dismiss" className="cursor-pointer">
        <X size={16} />
      </button>
    </div>
  ) : null;
}
export function Card({ title, value, detail, icon = "•" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-start justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
          {icon}
        </span>
        <span className="text-right">
          <b className="block text-lg">{value}</b>
          <small className="text-[11px] text-slate-500">
            {detail || title}
          </small>
        </span>
      </div>
    </div>
  );
}
export function Panel({ title, children, onClose }) {
  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {onClose && (
          <button onClick={onClose} title="Close" className="cursor-pointer">
            <X size={16} />
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}
export function Table({ columns, rows, onRow, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="text-[10px] tracking-wide text-slate-500 uppercase">
          <tr>
            {columns.map((column) => (
              <th className="p-3" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={idOf(row) || index}
              onClick={() => onRow?.(row)}
              className={`border-t border-slate-800 ${onRow ? "cursor-pointer hover:bg-slate-800/50" : ""}`}
            >
              {columns.map((column) => (
                <td className="p-3" key={column.key}>
                  {column.render
                    ? column.render(row, index)
                    : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="p-12 text-center text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}
export function Tabs({ values, current, onChange, labels = EMPTY_OBJECT }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-800">
      {values.map((value) => (
        <button
          className={`cursor-pointer border-b-2 px-3 py-3 text-xs whitespace-nowrap ${current === value ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-500"}`}
          onClick={() => onChange(value)}
          key={value}
        >
          {labels[value] || value}
        </button>
      ))}
    </div>
  );
}