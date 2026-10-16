import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  Printer,
  Send,
  XCircle,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, StatusPill, money } from "../billingUi.jsx";

const button =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm hover:border-blue-300";

export default function InvoicesPage() {
  const [selected, setSelected] = useState(null);
  const [drawer, setDrawer] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Invoice Types");
  const [status, setStatus] = useState("All Status");
  const query = useQuery({
    queryKey: ["billing", "invoices", "summary"],
    queryFn: () => billingApi.invoicesSummary(),
  });
  const data = query.data || {};
  const rows = useMemo(
    () =>
      (data.rows || []).filter((row) => {
        const text =
          `${row.invoiceNo} ${row.billTo} ${row.guestName} ${row.bookingNo}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (type === "All Invoice Types" ||
            row.type === type.toLowerCase().replaceAll(" ", "_")) &&
          (status === "All Status" ||
            String(row.status).toLowerCase() === status.toLowerCase())
        );
      }),
    [data.rows, search, status, type],
  );
  if (query.isLoading)
    return <div className="p-8 text-sm text-slate-500">Loading invoices…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Invoices could not be loaded.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Invoices
          </div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-xs text-slate-500">
            Create, view and manage guest invoices, receipts, credit notes and
            tax invoices.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => setDrawer("invoice")}
          >
            <Plus size={14} /> Generate Invoice
          </button>
          <button className={button} onClick={() => setDrawer("proforma")}>
            <FileText size={14} /> Proforma Invoice
          </button>
          <button className={button} onClick={() => setDrawer("credit-note")}>
            <FileCheck2 size={14} /> Credit Note
          </button>
          <button className={`${button} px-2`}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          label="Total Invoices"
          value={money(data.metrics?.total)}
          detail={`${data.metrics?.totalCount || 0} invoices`}
          tone="blue"
          icon={FileText}
        />
        <Kpi
          label="Paid Invoices"
          value={money(data.metrics?.paid)}
          detail={`${data.metrics?.paidCount || 0} invoices`}
          tone="green"
          icon={CheckCircle2}
        />
        <Kpi
          label="Pending Invoices"
          value={money(data.metrics?.pending)}
          detail={`${data.metrics?.pendingCount || 0} invoices`}
          tone="amber"
          icon={FileText}
        />
        <Kpi
          label="Cancelled / Refunded"
          value={money(data.metrics?.cancelled)}
          detail={`${data.metrics?.cancelledCount || 0} invoices`}
          tone="red"
          icon={XCircle}
        />
        <Kpi
          label="Corporate Invoices"
          value={money(data.metrics?.corporate)}
          detail={`${data.metrics?.corporateCount || 0} invoices`}
          tone="purple"
          icon={FileCheck2}
        />
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_305px]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
            <button className={button}>
              <CalendarDays size={14} /> 01 Oct 2026 - 05 Oct 2026
            </button>
            <select
              className="rounded-lg border border-slate-200 px-3 text-xs"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>All Invoice Types</option>
              <option value="tax">Tax Invoice</option>
              <option value="proforma">Proforma</option>
              <option value="receipt">Receipt</option>
              <option value="credit_note">Credit Note</option>
              <option value="corporate">Corporate</option>
            </select>
            <select
              className="rounded-lg border border-slate-200 px-3 text-xs"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className={`${button} ml-auto`}>
              <Download size={14} /> Export
            </button>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
              placeholder="Search invoice no, guest name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[10px]">
              <thead className="bg-slate-50 tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-3">
                    <input type="checkbox" />
                  </th>
                  {[
                    "Invoice No.",
                    "Date & Time",
                    "Guest Name",
                    "Booking No.",
                    "Amount (₹)",
                    "Status",
                    "Type",
                    "Actions",
                  ].map((label) => (
                    <th className="px-3 py-3 font-semibold" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className={`cursor-pointer border-b border-slate-50 ${selected?.id === row.id ? "bg-blue-50/50" : ""}`}
                    key={row.id}
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-3 font-semibold text-blue-700">
                      <FileText size={13} className="mr-1 inline" />
                      {row.invoiceNo}
                    </td>
                    <td className="px-3 py-3">{dateTime(row.createdAt)}</td>
                    <td className="px-3 py-3 font-semibold">
                      {row.billTo || row.guestName || "Guest"}
                    </td>
                    <td className="px-3 py-3">
                      {row.bookingNo || row.folioId || "—"}
                    </td>
                    <td className="px-3 py-3 font-bold">{money(row.amount)}</td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.status} />
                    </td>
                    <td className="px-3 py-3">{typeLabel(row.type)}</td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-slate-200 p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDrawer("invoice-menu");
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="p-10 text-center text-xs text-slate-400">
                No invoices match the selected filters.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 p-3 text-[10px] text-slate-500">
            <span>
              Showing 1 to {Math.min(rows.length, 10)} of {rows.length} invoices
            </span>
            <div className="flex gap-1">
              <button className={button}>‹</button>
              <button className="rounded bg-[#102b5c] px-3 py-2 text-white">
                1
              </button>
              <button className={button}>2</button>
              <button className={button}>3</button>
              <select className="ml-3 rounded border border-slate-200 px-2">
                <option>10 per page</option>
                <option>25 per page</option>
              </select>
            </div>
          </div>
        </section>
        <InvoicePreview invoice={selected} onAction={setDrawer} />
      </div>
      {drawer && (
        <InvoiceDrawer
          type={drawer}
          selected={selected}
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            query.refetch();
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, detail, tone, icon: Icon }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-rose-50 text-rose-600",
    purple: "bg-violet-50 text-violet-600",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex justify-between">
        <span
          className={`grid size-9 place-items-center rounded-lg ${colors[tone]}`}
        >
          <Icon size={17} />
        </span>
        <div className="text-right">
          <b className="block text-lg">{value}</b>
          <span className="text-[10px] text-slate-400">{detail}</span>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold">{label}</p>
    </article>
  );
}
function InvoicePreview({ invoice, onAction }) {
  if (!invoice)
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-400 shadow-sm">
        Select an invoice to preview it.
      </aside>
    );
  const items = invoice.items || [];
  return (
    <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-blue-50/50 p-3">
        <h2 className="border-l-2 border-blue-600 pl-2 text-sm font-bold">
          Invoice Preview
        </h2>
        <StatusPill value={invoice.status} />
      </div>
      <div className="p-4 text-[10px]">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <div className="grid size-8 place-items-center rounded bg-amber-100">
              ◆
            </div>
            <div>
              <b className="block text-xs">HotelOS</b>
              <span>
                123 Shapesea Dev Street,
                <br />
                Kolkata, West Bengal 700001
                <br />
                GSTIN: 19ABCDE1234F1Z5
              </span>
            </div>
          </div>
          <div>
            <b>TAX INVOICE</b>
            <br />
            Invoice No: {invoice.invoiceNo}
            <br />
            Date: {dateTime(invoice.createdAt)}
            <br />
            Booking: {invoice.bookingNo || invoice.folioId || "—"}
          </div>
        </div>
        <hr className="my-3" />
        <b>Guest Details</b>
        <p>
          {invoice.billTo || invoice.guestName || "Guest"}
          <br />
          {invoice.guestPhone || "—"}
          <br />
          {invoice.guestEmail || "—"}
        </p>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="border-b">
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.description || index}>
                <td>{index + 1}</td>
                <td>{item.description || item.name}</td>
                <td>{item.qty || item.quantity}</td>
                <td>{money(item.rate || item.price)}</td>
                <td>
                  {money(
                    item.amount ||
                      Number(item.rate || item.price || 0) *
                        Number(item.qty || item.quantity || 1),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 space-y-1 border-t pt-2">
          <Summary
            label="Subtotal"
            value={invoice.subtotal || invoice.amount}
          />
          <Summary label="Service Charge (10%)" value={invoice.serviceCharge} />
          <Summary label="CGST (9%)" value={invoice.cgst} />
          <Summary label="SGST (9%)" value={invoice.sgst} />
          <Summary
            label="Grand Total"
            value={invoice.grandTotal || invoice.amount}
            large
          />
          <Summary label="Amount Paid" value={invoice.paidAmount} green />
          <Summary
            label="Balance Due"
            value={invoice.balanceDue || invoice.amount}
            red
          />
        </div>
        <div className="my-4 flex h-16 items-center justify-center bg-slate-50 text-[9px]">
          QR code to pay
        </div>
        <p className="text-center text-slate-500">
          Thank you for staying with us!
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1">
          <button className={button} onClick={() => onAction("download")}>
            <Download size={12} /> PDF
          </button>
          <button className={button} onClick={() => onAction("print")}>
            <Printer size={12} /> Print
          </button>
          <button className={button} onClick={() => onAction("email")}>
            <Send size={12} /> Email
          </button>
          <button className={button} onClick={() => onAction("whatsapp")}>
            <Send size={12} /> WhatsApp
          </button>
        </div>
      </div>
    </aside>
  );
}
function Summary({ label, value, large, green, red }) {
  return (
    <div
      className={`flex justify-between ${large ? "text-base font-bold" : ""} ${green ? "text-emerald-600" : ""} ${red ? "text-red-500" : ""}`}
    >
      <span>{label}</span>
      <b>{money(value)}</b>
    </div>
  );
}
function dateTime(value) {
  return value
    ? `${new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : "—";
}
function typeLabel(type) {
  return (
    {
      tax: "Tax Invoice",
      proforma: "Proforma",
      receipt: "Receipt",
      credit_note: "Credit Note",
      corporate: "Corporate",
    }[type] ||
    type ||
    "Tax Invoice"
  );
}
function InvoiceDrawer({ type, selected, onClose, onComplete }) {
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      if (type === "invoice") await billingApi.createInvoice(body);
      else if (type === "proforma") await billingApi.createProforma(body);
      else if (type === "credit-note")
        await billingApi.createCreditNote(selected.id, body);
      else if (["email", "whatsapp"].includes(type))
        await billingApi.sendInvoice(selected.id, { ...body, channel: type });
      else if (type === "cancel")
        await billingApi.cancelInvoice(selected.id, body);
      onComplete();
    } catch (requestError) {
      setError(requestError.message || "Invoice action failed.");
    }
  };
  return (
    <ActionDrawer
      title={type.replace("-", " ")}
      onClose={onClose}
      onSubmit={submit}
    >
      {["invoice", "proforma"].includes(type) && (
        <>
          <Field label="Folio ID" name="folioId" required />
          <Field label="Bill to" name="billTo" />
          <Field label="GSTIN" name="gstin" />
          <Field label="Place of supply" name="placeOfSupply" />
        </>
      )}
      {type === "credit-note" && (
        <>
          <Field
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <Field label="Reason" name="reason" required />
        </>
      )}
      {["email", "whatsapp"].includes(type) && (
        <Field label="Recipient" name="recipient" required />
      )}
      {type === "cancel" && (
        <Field label="Cancellation reason" name="reason" required />
      )}
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}
