import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  WalletCards,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import {
  ActionDrawer,
  Field,
  StatusPill,
  ThermalReceiptModal,
  money,
} from "../billingUi.jsx";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm hover:border-blue-300";

export default function PaymentsPage() {
  const [drawer, setDrawer] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [thermalReceipt, setThermalReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("All Payment Methods");
  const [status, setStatus] = useState("All Status");
  const query = useQuery({
    queryKey: ["billing", "payments", "summary"],
    queryFn: () => billingApi.paymentsSummary(),
  });
  const data = query.data || {};
  const rows = useMemo(
    () =>
      (data.rows || []).filter((row) => {
        const queryText =
          `${row.guestName || ""} ${row.referenceNo || ""} ${row.bookingNo || ""} ${row.folioNo || ""}`.toLowerCase();
        return (
          queryText.includes(search.toLowerCase()) &&
          (method === "All Payment Methods" || row.method === method) &&
          (status === "All Status" || row.displayStatus === status)
        );
      }),
    [data.rows, method, search, status],
  );

  const exportCsv = () => {
    if (!rows.length) return;
    const headers = [
      "Payment ID",
      "Date",
      "Guest",
      "Folio / Bill",
      "Method",
      "Amount",
      "Status",
      "Reference",
    ];
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.transactionId || r._id || ""}"`,
          `"${r.createdAt ? new Date(r.createdAt).toISOString() : ""}"`,
          `"${r.guestName || ""}"`,
          `"${r.folioNo || r.billId || ""}"`,
          `"${r.method || ""}"`,
          r.amount || 0,
          `"${r.status || r.displayStatus || "success"}"`,
          `"${r.referenceNo || r.reference || ""}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };
  if (query.isLoading)
    return <div className="p-8 text-sm text-slate-500">Loading payments…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Payments could not be loaded. Please retry.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Payments
          </div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-xs text-slate-500">
            Track, collect and reconcile all hotel payments.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <CalendarDays size={14} className="text-blue-600" /> All Recent
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => setDrawer("collect")}
          >
            <Plus size={14} /> Collect Payment
          </button>
          <button className={buttonClass} onClick={() => setDrawer("record")}>
            <FileText size={14} /> Record Payment
          </button>
          <button className={buttonClass} onClick={() => setDrawer("refund")}>
            <RefreshCcw size={14} /> Refund
          </button>
        </div>
      </header>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Today's Collections"
          value={money(data.metrics?.todayCollections)}
          detail={`↑ ${data.metrics?.todayCollectionsChange || 0}% compared to yesterday`}
          tone="green"
          icon={WalletCards}
        />
        <Kpi
          label="Pending Payments"
          value={data.metrics?.pendingPayments || 0}
          detail="transactions"
          tone="amber"
          icon={AlertTriangle}
        />
        <Kpi
          label="Refunds (Today)"
          value={money(data.metrics?.refundsToday)}
          detail="transactions"
          tone="red"
          icon={RefreshCcw}
        />
        <Kpi
          label="Outstanding Balance"
          value={money(data.metrics?.outstandingBalance)}
          detail={`${data.metrics?.outstandingFolios || 0} guest folios`}
          tone="blue"
          icon={FileText}
        />
      </div>
      <div className="mb-3 grid gap-2 lg:grid-cols-[1.2fr_1.5fr_1fr]">
        <MethodBreakdown items={data.methodAmounts || []} />
        <CollectionsTrend items={data.trend || []} />
        <Reconciliation
          data={data.reconciliation || {}}
          onRun={() => setDrawer("reconcile")}
        />
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_250px]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
            <h2 className="border-l-2 border-amber-500 pl-2 text-sm font-bold">
              All Payments
            </h2>
            <button className={buttonClass} onClick={exportCsv}>
              <Download size={13} /> Export
            </button>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            >
              <option>All Payment Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="netbanking">Bank Transfer</option>
              <option value="wallet">Online Gateway</option>
            </select>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All Status</option>
              <option>Successful</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
            <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search size={14} />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search by guest name, reference..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[790px] text-left text-[10px]">
              <thead className="bg-slate-50 tracking-wide text-slate-500 uppercase">
                <tr>
                  {[
                    "Date & Time",
                    "Guest",
                    "Booking / Folio",
                    "Payment Method",
                    "Reference",
                    "Amount (₹)",
                    "Status",
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
                    className="border-b border-slate-50"
                    key={row._id || row.id}
                  >
                    <td className="px-3 py-3">{dateTime(row.createdAt)}</td>
                    <td className="px-3 py-3 font-semibold">{row.guestName}</td>
                    <td className="px-3 py-3">
                      {row.bookingNo}
                      <br />
                      <span className="text-slate-400">{row.folioNo}</span>
                    </td>
                    <td className="px-3 py-3">{methodLabel(row.method)}</td>
                    <td className="px-3 py-3">{row.referenceNo || "—"}</td>
                    <td className="px-3 py-3 font-bold">{money(row.amount)}</td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.displayStatus} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-slate-200 p-1"
                        onClick={() => {
                          setSelectedPayment(row);
                          setDrawer("payment-menu");
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
                No payments match the filters.
              </p>
            )}
          </div>
        </section>
        <aside className="space-y-2">
          <SideList title="Recent Refunds" rows={data.refunds || []} refund />
          <SideList
            title="Recent Payment Activity"
            rows={data.activity || []}
          />
        </aside>
      </div>
      <Alerts alerts={data.alerts || []} />
      {drawer && (
        <PaymentDrawer
          type={drawer}
          selected={selectedPayment}
          onOpenThermal={(p) => setThermalReceipt(p)}
          onClose={() => {
            setDrawer("");
            setSelectedPayment(null);
          }}
          onComplete={() => {
            setDrawer("");
            setSelectedPayment(null);
            query.refetch();
          }}
        />
      )}
      {thermalReceipt && (
        <ThermalReceiptModal
          title="Payment Slip"
          data={{
            invoiceNo:
              thermalReceipt.referenceNo ||
              thermalReceipt.reference ||
              `RCT-${thermalReceipt._id ? String(thermalReceipt._id).slice(-6) : "PAY"}`,
            createdAt: thermalReceipt.createdAt || new Date(),
            guestName: thermalReceipt.guestName || "Guest Payment",
            roomNumber: thermalReceipt.roomNo || thermalReceipt.roomNumber,
            bookingNo: thermalReceipt.bookingNo || thermalReceipt.folioNo,
            subtotal: thermalReceipt.amount,
            totalAmount: thermalReceipt.amount,
            items: [
              {
                name: `Payment - ${methodLabel(thermalReceipt.method)}`,
                price: thermalReceipt.amount,
                quantity: 1,
                notes: thermalReceipt.referenceNo || thermalReceipt.reference,
              },
            ],
            method: thermalReceipt.method,
          }}
          onClose={() => setThermalReceipt(null)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, detail, tone, icon: Icon }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span
          className={`grid size-9 place-items-center rounded-lg ${styles[tone]}`}
        >
          <Icon size={17} />
        </span>
        <div className="text-right">
          <div className="text-xl font-bold">{value}</div>
          <div className="text-[10px] text-slate-400">{detail}</div>
        </div>
      </div>
      <div className="mt-3 text-xs font-semibold">{label}</div>
    </article>
  );
}
function MethodBreakdown({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const colors = ["#2879e8", "#1fb98e", "#f4a261", "#835de8", "#ec4899"];

  const gradient = useMemo(() => {
    if (!total) return "#e2e8f0";
    let acc = 0;
    const stops = items.map((item, index) => {
      const pct = (Number(item.amount || 0) / total) * 100;
      const start = acc;
      acc += pct;
      return `${colors[index % colors.length]} ${start.toFixed(1)}% ${acc.toFixed(1)}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [items, total]);

  return (
    <Panel title="Payment Method Breakdown">
      <div className="flex items-center gap-4">
        <div
          className="grid size-28 place-items-center rounded-full"
          style={{
            background: gradient,
          }}
        >
          <div className="grid size-16 place-items-center rounded-full bg-white text-center text-[10px] font-bold">
            {money(total)}
            <span className="font-normal text-slate-400">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-1 text-[10px]">
          {items.map((item, index) => (
            <div className="flex justify-between gap-2" key={item.method}>
              <span>
                <i
                  className={`mr-1 inline-block size-2 rounded-full ${["bg-blue-500", "bg-emerald-500", "bg-orange-400", "bg-violet-500", "bg-pink-500"][index % 5]}`}
                />
                {methodLabel(item.method)}
              </span>
              <strong>{money(item.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
function CollectionsTrend({ items }) {
  const max = Math.max(...items.map((item) => Number(item.amount || 0)), 1);
  return (
    <Panel
      title="Collections Trend"
      action={
        <select className="rounded border border-slate-200 px-2 py-1 text-[10px]">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      }
    >
      <div className="flex h-32 items-end gap-2 border-b border-slate-100 px-2">
        {items.map((item) => (
          <div
            className="flex flex-1 flex-col items-center gap-1"
            key={`${item.label}-${item.amount}`}
          >
            <div
              className="w-full rounded-t bg-blue-500"
              style={{
                height: `${Math.max((Number(item.amount || 0) / max) * 90, 8)}px`,
              }}
            />
            <span className="text-[9px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-[10px] text-slate-400">
        ● Collections　<span className="text-amber-500">● Transactions</span>
      </div>
    </Panel>
  );
}
function Reconciliation({ data, onRun }) {
  return (
    <Panel
      title="Reconciliation Summary"
      action={
        <button className="text-[10px] font-semibold text-blue-600">
          View Details
        </button>
      }
    >
      <div className="space-y-3 text-xs">
        <Summary label="PMS Collected" value={data.pmsCollected} green />
        <Summary label="Gateway Settled" value={data.gatewaySettled} />
        <Summary label="Bank Received" value={data.bankReceived} />
        <Summary label="Unreconciled" value={data.unreconciled} red />
        <button
          className="w-full rounded-lg bg-[#102b5c] py-2 text-xs font-bold text-white"
          onClick={onRun}
        >
          <RefreshCcw size={13} className="mr-1 inline" /> Reconcile Now
        </button>
        <p className="text-center text-[9px] text-slate-400">
          Last reconciled:{" "}
          {data.lastReconciledAt
            ? dateTime(data.lastReconciledAt)
            : "Not reconciled"}
        </p>
      </div>
    </Panel>
  );
}
function SideList({ title, rows, refund }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-between border-b border-slate-100 pb-2">
        <h3 className="border-l-2 border-amber-500 pl-2 text-sm font-bold">
          {title}
        </h3>
        <button className="text-[10px] font-semibold text-blue-600">
          View All
        </button>
      </div>
      {rows.map((row, index) => (
        <div
          className="flex items-center gap-2 border-b border-slate-50 py-2 text-[10px]"
          key={row._id || row.id || `${row.label}-${index}`}
        >
          <span
            className={`grid size-6 place-items-center rounded ${refund ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-600"}`}
          >
            {refund ? <RefreshCcw size={12} /> : <CreditCard size={12} />}
          </span>
          <span className="mr-auto">
            <strong className="block">{row.guestName || row.label}</strong>
            <span className="text-slate-400">
              {row.folioNo || row.detail || row.reason || "Payment"}
            </span>
          </span>
          <strong className={refund ? "text-rose-500" : ""}>
            {money(row.amount)}
          </strong>
        </div>
      ))}
    </section>
  );
}
function Alerts({ alerts }) {
  return (
    <section className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-white p-3 text-[10px] shadow-sm">
      <strong className="text-amber-700">🔔 Payment Alerts</strong>
      {alerts.map((alert) => (
        <div
          className="flex-1 border-l border-slate-100 pl-3"
          key={alert.label}
        >
          <b>{alert.count ?? money(alert.amount)}</b>
          <span className="ml-1 text-slate-500">{alert.label}</span>
          <button className="ml-2 font-semibold text-blue-600">
            {alert.action} →
          </button>
        </div>
      ))}
    </section>
  );
}
function Panel({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 className="border-l-2 border-amber-500 pl-2 text-xs font-bold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Summary({ label, value, green, red }) {
  return (
    <div
      className={`flex justify-between ${green ? "text-emerald-600" : ""} ${red ? "text-red-500" : ""}`}
    >
      <span>{label}</span>
      <strong>{money(value)}</strong>
    </div>
  );
}
function methodLabel(method) {
  return (
    {
      upi: "UPI",
      card: "Card",
      cash: "Cash",
      netbanking: "Bank Transfer",
      wallet: "Online Gateway",
    }[method] ||
    method ||
    "—"
  );
}
function dateTime(value) {
  return value
    ? `${new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ${new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : "—";
}
function PaymentDrawer({ type, selected, onOpenThermal, onClose, onComplete }) {
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      if (type === "collect" || type === "record")
        await billingApi.createPayment({
          ...body,
          source: type === "record" ? "manual" : "desk",
          status: body.method === "wallet" ? "pending" : "success",
        });
      if (type === "refund") await billingApi.createRefund(body);
      if (type === "reconcile") await billingApi.runReconciliation(body);
      onComplete();
    } catch (requestError) {
      setError(requestError.message || "Payment action failed.");
    }
  };
  return (
    <ActionDrawer
      title={
        type === "collect"
          ? "Collect Payment"
          : type === "record"
            ? "Record External Payment"
            : type === "refund"
              ? "Issue Refund"
              : type === "payment-menu"
                ? "Payment Actions"
                : "Reconcile Payments"
      }
      onClose={onClose}
      onSubmit={
        type === "payment-menu"
          ? (e) => {
              e.preventDefault();
              onClose();
            }
          : submit
      }
      submitLabel={type === "payment-menu" ? "Done" : "Save"}
    >
      {type === "payment-menu" && selected && (
        <div className="space-y-3 text-xs">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold text-slate-700">
              {selected.guestName || "Guest Payment"}
            </p>
            <p className="text-slate-400">
              Ref: {selected.referenceNo || selected.reference || "—"} · Folio:{" "}
              {selected.folioNo || "—"}
            </p>
            <p className="mt-1 font-bold text-emerald-600">
              {money(selected.amount)} ({methodLabel(selected.method)})
            </p>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-2.5 text-left font-medium hover:bg-slate-50"
            onClick={() => {
              onOpenThermal?.(selected);
              onClose();
            }}
          >
            <span>Print 80mm POS Slip</span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
              Thermal
            </span>
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 p-2.5 text-left font-medium hover:bg-slate-50"
            onClick={() => {
              window.print();
              onClose();
            }}
          >
            Print Full Statement (A4)
          </button>
        </div>
      )}
      {(type === "collect" || type === "record") && (
        <>
          <Field label="Bill / Folio ID" name="billId" required />
          <Field
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <label className="block text-xs font-semibold text-slate-600">
            Payment method
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
              name="method"
              defaultValue="cash"
            >
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="netbanking">Bank Transfer</option>
              <option value="wallet">Online Gateway</option>
            </select>
          </label>
          <Field
            label="Reference / UTR"
            name="referenceNo"
            required={type === "record"}
          />
        </>
      )}
      {type === "refund" && (
        <>
          <Field label="Payment ID" name="paymentId" required />
          <Field label="Bill ID" name="billId" required />
          <Field
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <Field label="Reason" name="reason" required />
          <Field
            label="Refund mode"
            name="paymentMethod"
            defaultValue="original"
          />
        </>
      )}
      {type === "reconcile" && (
        <Field label="Business date" name="businessDate" type="date" required />
      )}
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}
