import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  Header,
  Button,
  StatusChip,
  ReceiptModal,
  KpiTile,
  KpiTileRow,
} from "@hotelos/ui/components";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, money } from "../billingUi.jsx";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-900 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer";

export default function InvoicesPage() {
  const [selected, setSelected] = useState(null);
  const [drawer, setDrawer] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Invoice Types");
  const [status, setStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = useQuery({
    queryKey: ["billing", "invoices", "summary"],
    queryFn: () => billingApi.invoicesSummary(),
  });
  const data = query.data || {};
  const rows = useMemo(
    () =>
      (data.rows || []).filter((row) => {
        const text =
          `${row.invoiceNo || ""} ${row.billTo || ""} ${row.guestName || ""} ${row.bookingNo || ""}`.toLowerCase();
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

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const totalPages = Math.ceil(rows.length / pageSize) || 1;

  const exportCsv = () => {
    if (!rows.length) return;
    const headers = [
      "Invoice No",
      "Date",
      "Bill To",
      "Booking",
      "Amount",
      "Status",
      "Type",
    ];
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.invoiceNo || ""}"`,
          `"${r.createdAt || ""}"`,
          `"${r.billTo || r.guestName || ""}"`,
          `"${r.bookingNo || r.folioId || ""}"`,
          r.amount || 0,
          `"${r.status || ""}"`,
          `"${r.type || ""}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (query.isLoading)
    return <div className="p-8 text-sm text-gray-500">Loading invoices…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
        Invoices could not be loaded.
      </div>
    );

  return (
    <>
      <Header
        pageTitle="Invoices"
        pageDescription="Create, view and manage guest invoices, receipts, credit notes and tax invoices."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setDrawer("invoice")}
        >
          Generate Invoice
        </Button>
        <Button
          variant="secondary"
          icon={FileText}
          onClick={() => setDrawer("proforma")}
        >
          Proforma Invoice
        </Button>
        <Button
          variant="secondary"
          icon={FileCheck2}
          onClick={() => setDrawer("credit-note")}
        >
          Credit Note
        </Button>
        <Button variant="secondary" icon={Download} onClick={exportCsv}>
          Export CSV
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        <KpiTileRow>
          <KpiTile
            label="Total Invoiced"
            value={money(data.metrics?.totalInvoiced)}
            delta="gross invoiced"
            icon={FileText}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <KpiTile
            label="Paid Invoices"
            value={money(data.metrics?.paidAmount)}
            delta={`${data.metrics?.paidCount || 0} invoices`}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Pending / Unpaid"
            value={money(data.metrics?.unpaidAmount)}
            delta={`${data.metrics?.unpaidCount || 0} unpaid`}
            icon={CalendarDays}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Overdue Invoices"
            value={money(data.metrics?.overdueAmount)}
            delta={`${data.metrics?.overdueCount || 0} past due`}
            deltaTone="down"
            icon={XCircle}
            iconClassName="bg-rose-50 text-rose-700"
          />
          <KpiTile
            label="Credit Notes"
            value={money(data.metrics?.creditNoteAmount)}
            delta={`${data.metrics?.creditNoteCount || 0} issued`}
            icon={FileCheck2}
            iconClassName="bg-purple-50 text-purple-700"
          />
        </KpiTileRow>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 p-4">
              <h2 className="font-display text-brand-900 text-sm font-semibold">
                All Invoices
              </h2>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={exportCsv}
              >
                Export
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
              <select
                className={buttonClass}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>All Invoice Types</option>
                <option>Tax Invoice</option>
                <option>Proforma</option>
                <option>Receipt</option>
                <option>Credit Note</option>
                <option>Corporate</option>
              </select>
              <select
                className={buttonClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All Status</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Overdue</option>
                <option>Cancelled</option>
              </select>
              <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-400">
                <Search size={14} />
                <input
                  className="text-brand-900 min-w-0 flex-1 outline-none placeholder:text-gray-400"
                  placeholder="Search invoice number, guest, booking..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] tracking-wide text-gray-500 uppercase">
                    {[
                      "Invoice No",
                      "Date",
                      "Bill To / Guest",
                      "Booking",
                      "Type",
                      "Total Amount",
                      "Status",
                      "Actions",
                    ].map((label) => (
                      <th className="px-4 py-3 font-semibold" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {paginatedRows.map((row) => (
                    <tr
                      key={row._id || row.id || row.invoiceNo}
                      onClick={() => setSelected(row)}
                      className={`cursor-pointer transition-colors ${
                        selected?.id === row.id
                          ? "bg-brand-50/50"
                          : "hover:bg-gray-50/50"
                      }`}
                    >
                      <td className="text-brand-900 px-4 py-3 font-semibold">
                        {row.invoiceNo}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {dateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-brand-900 block font-medium">
                          {row.billTo || row.guestName || "Walk-in Guest"}
                        </strong>
                        <span className="text-[11px] text-gray-400">
                          {row.guestPhone || row.companyName || ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.bookingNo || row.folioId || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {typeLabel(row.type)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {money(row.amount || row.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip variant={row.status}>
                          {row.status || "Paid"}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-surface-400 hover:text-brand-900 cursor-pointer rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                            setDrawer("invoice-menu");
                          }}
                          aria-label="Invoice options"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && (
                <p className="p-10 text-center text-xs text-gray-400">
                  No invoices found matching criteria.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span>
                Showing {rows.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, rows.length)} of {rows.length}{" "}
                invoices
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Prev
                </Button>
                <span className="text-brand-900 px-2 font-semibold">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next ›
                </Button>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </section>

          <InvoicePreview invoice={selected} onAction={setDrawer} />
        </div>
      </div>

      {drawer === "thermal" && selected && (
        <ReceiptModal
          title={`Tax Invoice — ${selected.invoiceNo || "Slip"}`}
          data={{
            ...selected,
            paymentMethod: selected.paymentMethod || "Bank/Card",
          }}
          onClose={() => setDrawer("")}
        />
      )}

      {drawer && drawer !== "thermal" && (
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
    </>
  );
}

function InvoicePreview({ invoice, onAction }) {
  if (!invoice)
    return (
      <aside className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400 shadow-xs">
        Select an invoice to preview it.
      </aside>
    );
  const items = invoice.items || [];
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 p-4">
        <h2 className="font-display text-brand-900 text-sm font-semibold">
          Invoice Preview
        </h2>
        <StatusChip variant={invoice.status}>
          {invoice.status || "Paid"}
        </StatusChip>
      </div>
      <div className="p-4 text-xs">
        <div className="flex justify-between gap-3">
          <div className="flex gap-2">
            <div className="bg-primary-50 text-primary-700 grid size-8 place-items-center rounded-lg font-bold">
              ◆
            </div>
            <div>
              <b className="text-brand-900 block text-xs">HotelOS</b>
              <span className="text-[11px] text-gray-500">
                123 Shapesea Dev Street,
                <br />
                Kolkata, West Bengal 700001
                <br />
                GSTIN: 19ABCDE1234F1Z5
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] text-gray-600">
            <b className="text-brand-900 block">TAX INVOICE</b>
            Invoice No: {invoice.invoiceNo}
            <br />
            Date: {dateTime(invoice.createdAt)}
            <br />
            Booking: {invoice.bookingNo || invoice.folioId || "—"}
          </div>
        </div>
        <hr className="my-3 border-gray-100" />
        <b className="text-brand-900 mb-1 block">Guest Details</b>
        <p className="text-[11px] text-gray-600">
          {invoice.billTo || invoice.guestName || "Guest"}
          <br />
          {invoice.guestPhone || "—"}
          <br />
          {invoice.guestEmail || "—"}
        </p>
        <table className="mt-3 w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="py-1">#</th>
              <th className="py-1">Description</th>
              <th className="py-1">Qty</th>
              <th className="py-1">Rate</th>
              <th className="py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {items.map((item, index) => (
              <tr key={item.description || index}>
                <td className="py-1">{index + 1}</td>
                <td className="py-1">{item.description || item.name}</td>
                <td className="py-1">{item.qty || item.quantity}</td>
                <td className="py-1">{money(item.rate || item.price)}</td>
                <td className="py-1 text-right font-medium">
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
        <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-2.5">
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
        <div className="my-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-[10px]">
          <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white p-1 shadow-2xs">
            <svg viewBox="0 0 24 24" className="size-10 fill-gray-800">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4-2h2v2h-2v-2zm2 4h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-4h2v2h-2v-2zm2 4h2v2h-2v-2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 leading-tight text-gray-500">
            <span className="text-brand-900 block font-bold">
              GST E-Invoice (NIC IRN)
            </span>
            <span className="block truncate font-mono text-[9px] text-gray-600">
              {invoice.irn ||
                "8a4f9e72bc13d09a5b67e41c3d2891f043e8b15d6c97a213e4b50c18d9e23f47"}
            </span>
            <span>
              Ack Date:{" "}
              {invoice.createdAt
                ? new Date(invoice.createdAt).toLocaleDateString("en-IN")
                : "Today"}
            </span>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-500">
          Thank you for staying with us!
        </p>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          <button className={buttonClass} onClick={() => onAction("download")}>
            <Download size={12} /> PDF
          </button>
          <button className={buttonClass} onClick={() => onAction("print")}>
            <Printer size={12} /> Print
          </button>
          <button className={buttonClass} onClick={() => onAction("thermal")}>
            <Printer size={12} /> 80mm
          </button>
          <button className={buttonClass} onClick={() => onAction("email")}>
            <Send size={12} /> Email
          </button>
          <button className={buttonClass} onClick={() => onAction("whatsapp")}>
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
      className={`flex justify-between ${large ? "text-brand-900 text-sm font-bold" : "text-gray-600"} ${green ? "font-semibold text-emerald-600" : ""} ${red ? "font-semibold text-rose-600" : ""}`}
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
  const requiresSelected = [
    "credit-note",
    "cancel",
    "email",
    "whatsapp",
    "print",
    "download",
    "invoice-menu",
  ].includes(type);

  if (requiresSelected && !selected?.id) {
    return (
      <ActionDrawer
        title={type.replace("-", " ")}
        onClose={onClose}
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
        submitLabel="Close"
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Please select an invoice from the list first before performing this
          action.
        </div>
      </ActionDrawer>
    );
  }

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
      else if (type === "print") {
        window.print();
      } else if (type === "download") {
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(selected, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute(
          "download",
          `invoice-${selected.invoiceNo || selected.id}.json`,
        );
        downloadAnchor.click();
      }
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
      submitLabel={
        type === "print"
          ? "Print Invoice"
          : type === "download"
            ? "Download File"
            : type === "invoice-menu"
              ? "Done"
              : "Save"
      }
    >
      {type === "invoice-menu" && selected && (
        <div className="space-y-3 text-xs">
          <p className="text-brand-900 font-semibold">
            Invoice: {selected.invoiceNo}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.print();
                onClose();
              }}
            >
              Print Invoice
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const dataStr =
                  "data:text/json;charset=utf-8," +
                  encodeURIComponent(JSON.stringify(selected, null, 2));
                const a = document.createElement("a");
                a.href = dataStr;
                a.download = `invoice-${selected.invoiceNo}.json`;
                a.click();
                onClose();
              }}
            >
              Download JSON
            </Button>
          </div>
        </div>
      )}
      {type === "print" && (
        <p className="text-xs text-gray-600">
          Click below to open the print dialog for invoice {selected?.invoiceNo}
          .
        </p>
      )}
      {type === "download" && (
        <p className="text-xs text-gray-600">
          Click below to export invoice data for {selected?.invoiceNo}.
        </p>
      )}
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
          <div className="mb-2 text-xs text-gray-500">
            Original Invoice:{" "}
            <b className="text-brand-900">{selected?.invoiceNo}</b> (₹
            {selected?.amount || 0})
          </div>
          <Field
            label="Credit amount"
            name="amount"
            type="number"
            min="0"
            max={selected?.amount}
            step="0.01"
            defaultValue={selected?.amount}
            required
          />
          <Field
            label="Reason"
            name="reason"
            required
            placeholder="e.g. Rate adjustment or billing correction"
          />
        </>
      )}
      {["email", "whatsapp"].includes(type) && (
        <Field
          label="Recipient (Email / Phone)"
          name="recipient"
          required
          defaultValue={selected?.guestEmail || selected?.guestPhone || ""}
        />
      )}
      {type === "cancel" && (
        <>
          <div className="mb-2 text-xs text-rose-600">
            You are cancelling invoice {selected?.invoiceNo}.
          </div>
          <Field label="Cancellation reason" name="reason" required />
        </>
      )}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </p>
      )}
    </ActionDrawer>
  );
}
