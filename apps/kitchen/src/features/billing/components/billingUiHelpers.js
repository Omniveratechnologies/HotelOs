import { getBillingSettings } from "../services/billing.js";
import { useEffect, useState } from "react";

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

export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ key: null, data: null, error: "" });
  const [version, setVersion] = useState(0);
  const key = `${version}:${JSON.stringify(deps)}`;

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;

    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ key, data, error: "" });
      })
      .catch((err) => {
        if (active) setState({ key, data: null, error: err.message });
      });

    return () => {
      active = false;
    };
  }, [key]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const setData = useCallback((next) => {
    setState((prev) => ({
      ...prev,
      data: typeof next === "function" ? next(prev.data) : next,
    }));
  }, []);

  const setError = useCallback((message) => {
    setState((prev) => ({ ...prev, error: message }));
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== key,
    refresh,
    setData,
    setError,
  };
}