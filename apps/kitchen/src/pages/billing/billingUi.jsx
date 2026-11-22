/* oxlint-disable react/set-state-in-effect */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getBillingSettings } from "../../services/billing.js";

export const css =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
export const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const dateText = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
export const idOf = (value) => value?.id || value?._id || "";
export const statusClass = (value) =>
  ({
    paid: "text-emerald-400",
    saved: "text-blue-400",
    pending: "text-amber-400",
    completed: "text-emerald-400",
    cancelled: "text-red-400",
    rejected: "text-red-400",
    unpaid: "text-amber-400",
  })[String(value).toLowerCase()] || "text-slate-400";

export function waLink(phone, text) {
  const clean = (phone || "").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function billShareText(bill) {
  const lines = (bill.items || []).map(
    (i) => `${i.name} x${i.quantity}  ${money(i.price * i.quantity)}`,
  );
  return [
    `Bill ${bill.billNo}`,
    ...lines,
    `Subtotal: ${money(bill.subtotal)}`,
    bill.discountAmount ? `Discount: -${money(bill.discountAmount)}` : null,
    `CGST: ${money(bill.cgst)}  SGST: ${money(bill.sgst)}`,
    `Total: ${money(bill.totalAmount)}`,
    "Thank you for visiting!",
  ]
    .filter(Boolean)
    .join("\n");
}

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
export function useLoad(loader, deps = []) {
  const [data, setData] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true);
    loader()
      .then((value) => active && setData(value || []))
      .catch(
        (loadError) =>
          active && setError(loadError.message || "Unable to load data"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, deps);
  return { data, setData, loading, error, setError };
}
export function Tabs({ values, current, onChange, labels = {} }) {
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

export async function printInvoice(bill) {
  let settings = {};
  try {
    settings = await getBillingSettings();
  } catch {
    /* fall back to defaults below */
  }
  const invoice = settings.invoice || {};

  const rows = (bill.items || [])
    .map(
      (i) => `
    <tr><td>${i.name}</td><td>${i.quantity}</td><td>${money(i.price)}</td><td>${money(i.price * i.quantity)}</td></tr>
  `,
    )
    .join("");

  const win = window.open("", "_blank", "width=420,height=700");
  if (!win) return;
  win.document.write(`
    <html><head><title>Invoice ${bill.billNo}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111;}
      h2,h3{margin:4px 0;text-align:center;}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;}
      th,td{padding:4px 2px;text-align:left;}
      th{border-bottom:1px solid #999;}
      .totals p{display:flex;justify-content:space-between;margin:2px 0;font-size:13px;}
      .grand{font-weight:bold;border-top:1px solid #333;padding-top:6px;font-size:15px;}
      .center{text-align:center;}
      hr{border:none;border-top:1px dashed #999;margin:8px 0;}
    </style></head><body>
      <h2>${invoice.restaurantName || "Hotel Grandview"}</h2>
      <p class="center">${invoice.address || ""}</p>
      <p class="center">${invoice.gstin ? "GSTIN: " + invoice.gstin : ""}</p>
      <p class="center">${invoice.phone || ""}</p>
      <hr/>
      <h3 class="center">Invoice</h3>
      <p>Bill No: ${bill.billNo}</p>
      <p>Date: ${new Date(bill.createdAt || Date.now()).toLocaleString()}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <hr/>
      <div class="totals">
        <p><span>Sub Total</span><span>${money(bill.subtotal)}</span></p>
        ${bill.discountAmount ? `<p><span>Discount</span><span>-${money(bill.discountAmount)}</span></p>` : ""}
        <p><span>CGST</span><span>${money(bill.cgst)}</span></p>
        <p><span>SGST</span><span>${money(bill.sgst)}</span></p>
        <p class="grand"><span>Total</span><span>${money(bill.totalAmount)}</span></p>
      </div>
      <p class="center" style="margin-top:16px;">${invoice.footer || "Thank you for visiting!"}</p>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
