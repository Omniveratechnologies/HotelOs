import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

export const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export const dateText = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const idOf = (value) => value?.id || value?._id || "";

const statusStyles = {
  paid: "bg-emerald-50 text-emerald-700",
  successful: "bg-emerald-50 text-emerald-700",
  active: "bg-emerald-50 text-emerald-700",
  posted: "bg-emerald-50 text-emerald-700",
  matched: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  partial: "bg-amber-50 text-amber-700",
  draft: "bg-amber-50 text-amber-700",
  overdue: "bg-rose-50 text-rose-700",
  cancelled: "bg-rose-50 text-rose-700",
  failed: "bg-rose-50 text-rose-700",
  discrepancy: "bg-rose-50 text-rose-700",
  reversed: "bg-slate-100 text-slate-600",
};

export function StatusPill({ value }) {
  const label = String(value || "Pending").replaceAll("_", " ");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
        statusStyles[label.toLowerCase()] || "bg-blue-50 text-blue-700"
      }`}
    >
      {label}
    </span>
  );
}

export function KpiCard({ label, value, detail, tone = "blue", icon: Icon }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-rose-50 text-rose-600",
    purple: "bg-violet-50 text-violet-600",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}
        >
          {Icon ? <Icon size={18} /> : <span className="text-lg">₹</span>}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#102b5c]">{value}</p>
          <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-600">{label}</p>
    </article>
  );
}

export function Panel({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-[#102b5c]">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EmptyState({ text = "No records available." }) {
  return <p className="py-12 text-center text-sm text-slate-400">{text}</p>;
}

export function BillingTable({ columns, rows, onRow, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] tracking-wide text-slate-500 uppercase">
            {columns.map((column) => (
              <th className="px-3 py-3 font-semibold" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={`border-b border-slate-50 text-slate-700 last:border-0 ${
                onRow ? "cursor-pointer hover:bg-blue-50/40" : ""
              }`}
              key={idOf(row) || index}
              onClick={() => onRow?.(row)}
            >
              {columns.map((column) => (
                <td className="px-3 py-3" key={column.key}>
                  {column.render
                    ? column.render(row, index)
                    : row[column.key] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <EmptyState text={empty} />}
    </div>
  );
}

export function BillingToolbar({
  search,
  setSearch,
  filters = true,
  exportLabel = "Export",
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 p-3 sm:flex-row sm:items-center">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
        <Search size={15} />
        <input
          className="min-w-0 flex-1 outline-none placeholder:text-slate-400"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search guest, booking, invoice..."
        />
      </label>
      {filters && (
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
          <Filter size={14} /> Filters
        </button>
      )}
      <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
        <Download size={14} /> {exportLabel}
      </button>
    </div>
  );
}

export function DetailDrawer({ title, row, onClose, fields = [] }) {
  if (!row) return null;
  return (
    <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-[#102b5c]">{title}</h2>
        <button
          className="text-slate-400 hover:text-slate-700"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>
      </div>
      <div className="space-y-3 p-4">
        {fields.map(({ label, key, render }) => (
          <div className="flex justify-between gap-4 text-xs" key={key}>
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-semibold text-slate-700">
              {render ? render(row) : row[key] || "—"}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ActionDrawer({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Save",
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/25">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-[#102b5c]">{title}</h2>
          <button
            className="text-xl text-slate-400"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          {children}
          <button className="w-full rounded-lg bg-[#102b5c] px-4 py-3 text-sm font-semibold text-white">
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Field({ label, children, ...props }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      {children || (
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
          {...props}
        />
      )}
    </label>
  );
}

export function BillingPageHeader({ title, description, actions = [] }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600">
          <Link to="/billing/folio">Billing &amp; Folio</Link>
          <span>›</span>
          <span>{title}</span>
        </div>
        <h1 className="text-2xl font-bold text-[#102b5c] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, primary, icon: Icon, onClick }) => (
          <button
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold ${
              primary
                ? "bg-[#102b5c] text-white hover:bg-[#193d7c]"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            key={label}
            onClick={onClick}
          >
            {Icon ? <Icon size={15} /> : <Plus size={15} />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useFilteredRows(rows) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query),
    );
  }, [rows, search]);
  return { search, setSearch, filtered };
}

export function MiniBars({ values = [] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <div className="flex flex-1 flex-col items-center gap-1" key={index}>
          <div
            className="w-full rounded-t bg-blue-500"
            style={{ height: `${Math.max((value / max) * 88, 4)}px` }}
          />
          <span className="text-[9px] text-slate-400">{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export const icons = {
  collection: ArrowDownToLine,
  outgoing: ArrowUpRight,
  calendar: CalendarDays,
  more: MoreHorizontal,
  chevron: ChevronDown,
};

export function ThermalReceiptModal({ title = "Receipt", data = {}, onClose }) {
  if (!data) return null;
  const items = data.items || data.charges || [];
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-[340px] overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b pb-2 text-xs">
          <span className="font-bold text-[#102b5c]">{title}</span>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* 80mm POS Printable Area */}
        <div
          id="printable-receipt"
          className="border border-dashed border-slate-300 bg-amber-50/20 p-3 font-mono text-[11px] leading-tight text-slate-800"
        >
          <div className="text-center">
            <b className="block text-sm font-bold tracking-wider">
              HOTELOS RESORT &amp; SPA
            </b>
            <p className="text-[10px] text-slate-500">
              123 Shapesea Dev Street, Kolkata - 700001
              <br />
              GSTIN: 19ABCDE1234F1Z5 | Ph: +91 33 2244 5566
            </p>
          </div>
          <div className="my-2 border-b border-dashed border-slate-400" />
          <div className="flex justify-between text-[10px]">
            <span>
              RCPT:{" "}
              {data.invoiceNo || data.billNo || data.folioNo || "RC-RECEIPT"}
            </span>
            <span>
              {data.date || data.createdAt
                ? new Date(data.date || data.createdAt).toLocaleDateString(
                    "en-IN",
                  )
                : "Today"}
            </span>
          </div>
          <div className="text-[10px]">
            <span>
              Guest: <b>{data.guestName || data.billTo || "Walk-in Guest"}</b>
            </span>
            {data.roomNumber && (
              <span className="block">Room: {data.roomNumber}</span>
            )}
            {data.bookingNo && (
              <span className="block">Booking: {data.bookingNo}</span>
            )}
          </div>
          <div className="my-2 border-b border-dashed border-slate-400" />
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-1">{it.name || it.description}</td>
                  <td className="py-1 text-center">
                    {it.quantity || it.qty || 1}
                  </td>
                  <td className="py-1 text-right">
                    {money(
                      it.amount ||
                        Number(it.price || it.rate || 0) *
                          Number(it.quantity || it.qty || 1),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="my-2 border-b border-dashed border-slate-400" />
          <div className="space-y-1 text-right text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{money(data.subtotal || data.amount || 0)}</span>
            </div>
            {data.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge:</span>
                <span>{money(data.serviceCharge)}</span>
              </div>
            )}
            {data.cgst > 0 && (
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>{money(data.cgst)}</span>
              </div>
            )}
            {data.sgst > 0 && (
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>{money(data.sgst)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-1 text-xs font-bold text-slate-900">
              <span>TOTAL AMOUNT:</span>
              <span>
                {money(data.grandTotal || data.totalAmount || data.amount || 0)}
              </span>
            </div>
            {(data.paid > 0 || data.totalPaid > 0) && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  PAID ({data.paymentMethod || data.method || "Cash"}):
                </span>
                <span>{money(data.paid || data.totalPaid)}</span>
              </div>
            )}
            {data.balanceDue > 0 && (
              <div className="flex justify-between font-bold text-rose-700">
                <span>BALANCE DUE:</span>
                <span>{money(data.balanceDue)}</span>
              </div>
            )}
          </div>
          <div className="my-2 border-b border-dashed border-slate-400" />
          <div className="text-center text-[9px] text-slate-500">
            <p>
              IRN:{" "}
              {data.irn
                ? `${String(data.irn).slice(0, 10)}...`
                : "948274...EINV"}{" "}
              (E-Invoice Verified)
            </p>
            <p className="mt-1 font-bold">Thank You for Staying With Us!</p>
            <p>Please Visit Again</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-lg bg-[#102b5c] py-2 text-xs font-bold text-white shadow hover:bg-[#193d7c]"
          >
            Print 80mm Slip
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
