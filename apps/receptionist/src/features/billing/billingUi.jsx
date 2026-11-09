import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@hotelos/utils";
import {
  StatusChip,
  ReceiptModal,
  DataTable,
  KpiTile,
  KpiTileRow,
  Button,
  Input,
  Header,
} from "@hotelos/ui/components";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

// Canonical formatters
export const money = (value) => formatCurrency(value);
export const dateText = (value) => formatDate(value);
export const idOf = (value) => value?.id || value?._id || "";

// Canonical UI components re-exported for single source
export {
  StatusChip,
  StatusChip as StatusPill,
  ReceiptModal,
  ReceiptModal as ThermalReceiptModal,
  DataTable,
  DataTable as BillingTable,
  KpiTile,
  KpiTileRow,
  Button,
  Input,
  Header,
};

export function Panel({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
        <h2 className="font-display text-brand-900 text-sm font-semibold">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
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
    <div
      className="backdrop-blur-2xs fixed inset-0 z-40 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="font-display text-brand-900 text-base font-semibold">
            {title}
          </h2>
          <button
            className="text-surface-400 hover:text-brand-900 rounded-lg p-1 transition-colors hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          {children}
          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full">
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DetailDrawer({ title, row, onClose, fields = [] }) {
  if (!row) return null;
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
        <h2 className="font-display text-brand-900 text-sm font-semibold">
          {title}
        </h2>
        <button
          className="text-surface-400 hover:text-brand-900 rounded-lg p-1 transition-colors hover:bg-gray-100"
          onClick={onClose}
          aria-label="Close details"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-3.5 p-6">
        {fields.map(({ label, key, render }) => (
          <div className="flex justify-between gap-4 text-xs" key={key}>
            <span className="text-gray-500">{label}</span>
            <span className="text-brand-900 text-right font-medium">
              {render ? render(row) : row[key] || "—"}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function Field({ label, children, ...props }) {
  return (
    <label className="text-brand-900 block text-xs font-semibold">
      {label}
      {children || (
        <input
          className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-normal transition outline-none placeholder:text-gray-400 focus:ring-2"
          {...props}
        />
      )}
    </label>
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
            className="bg-primary-500 w-full rounded-t transition-all"
            style={{ height: `${Math.max((value / max) * 88, 4)}px` }}
          />
          <span className="text-[9px] text-gray-400">{index + 1}</span>
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

export function KpiSkeletonRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"
        >
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="divide-y divide-gray-100 p-6">
        <div className="mb-4 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-3.5 flex-1 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 py-3.5">
            {Array.from({ length: columns }).map((col, colIdx) => (
              <div
                key={colIdx}
                className="h-3 flex-1 animate-pulse rounded bg-gray-100"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillingPageSkeleton({ kpis = 4, tableRows = 5 }) {
  return (
    <div className="space-y-6">
      <KpiSkeletonRow count={kpis} />
      <TableSkeleton rows={tableRows} />
    </div>
  );
}
