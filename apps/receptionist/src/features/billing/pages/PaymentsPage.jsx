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
  AlertTriangle,
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
import { ActionDrawer, Field, Panel, money } from "../billingUi.jsx";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-900 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer";

export default function PaymentsPage() {
  const [drawer, setDrawer] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptPayment, setReceiptPayment] = useState(null);
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
    return <div className="p-8 text-sm text-gray-500">Loading payments…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
        Payments could not be loaded. Please retry.
      </div>
    );

  return (
    <>
      <Header
        pageTitle="Payments"
        pageDescription="Track, collect and reconcile all hotel payments."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setDrawer("collect")}
        >
          Collect Payment
        </Button>
        <Button
          variant="secondary"
          icon={FileText}
          onClick={() => setDrawer("record")}
        >
          Record Payment
        </Button>
        <Button
          variant="secondary"
          icon={RefreshCcw}
          onClick={() => setDrawer("refund")}
        >
          Refund
        </Button>
        <Button variant="secondary" icon={Download} onClick={exportCsv}>
          Export CSV
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        <KpiTileRow>
          <KpiTile
            label="Today's Collections"
            value={money(data.metrics?.todayCollections)}
            delta={`↑ ${data.metrics?.todayCollectionsChange || 0}% compared to yesterday`}
            deltaTone="up"
            icon={WalletCards}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Pending Payments"
            value={data.metrics?.pendingPayments || 0}
            delta="transactions"
            icon={AlertTriangle}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Refunds (Today)"
            value={money(data.metrics?.refundsToday)}
            delta="transactions"
            deltaTone="down"
            icon={RefreshCcw}
            iconClassName="bg-rose-50 text-rose-700"
          />
          <KpiTile
            label="Outstanding Balance"
            value={money(data.metrics?.outstandingBalance)}
            delta={`${data.metrics?.outstandingFolios || 0} guest folios`}
            icon={FileText}
            iconClassName="bg-blue-50 text-blue-700"
          />
        </KpiTileRow>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.5fr_1fr]">
          <MethodBreakdown items={data.methodAmounts || []} />
          <CollectionsTrend items={data.trend || []} />
          <Reconciliation
            data={data.reconciliation || {}}
            onRun={() => setDrawer("reconcile")}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 p-4">
              <h2 className="font-display text-brand-900 text-sm font-semibold">
                All Payments
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
                className={buttonClass}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>All Status</option>
                <option>Successful</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
              <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-400">
                <Search size={14} />
                <input
                  className="text-brand-900 min-w-0 flex-1 outline-none placeholder:text-gray-400"
                  placeholder="Search by guest name, reference..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[790px] text-left text-xs">
                <thead className="bg-gray-50/50 text-[10px] tracking-wide text-gray-500 uppercase">
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
                      <th className="px-4 py-3 font-semibold" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {rows.map((row) => (
                    <tr
                      className="transition-colors hover:bg-gray-50/50"
                      key={row._id || row.id}
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {dateTime(row.createdAt)}
                      </td>
                      <td className="text-brand-900 px-4 py-3 font-semibold">
                        {row.guestName}
                      </td>
                      <td className="px-4 py-3">
                        {row.bookingNo}
                        <br />
                        <span className="text-gray-400">{row.folioNo}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {methodLabel(row.method)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {row.referenceNo || "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {money(row.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip variant={row.displayStatus}>
                          {row.displayStatus || "Successful"}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-surface-400 hover:text-brand-900 cursor-pointer rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-gray-100"
                          onClick={() => {
                            setSelectedPayment(row);
                            setDrawer("payment-menu");
                          }}
                          aria-label="Payment options"
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
                  No payments match the filters.
                </p>
              )}
            </div>
          </section>
          <aside className="space-y-4">
            <SideList title="Recent Refunds" rows={data.refunds || []} refund />
            <SideList
              title="Recent Payment Activity"
              rows={data.activity || []}
            />
          </aside>
        </div>
        <Alerts alerts={data.alerts || []} />
      </div>

      {drawer && (
        <PaymentDrawer
          type={drawer}
          selected={selectedPayment}
          onOpenThermal={(p) => setReceiptPayment(p)}
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

      {receiptPayment && (
        <ReceiptModal
          title="Payment Slip"
          data={{
            invoiceNo:
              receiptPayment.referenceNo ||
              receiptPayment.reference ||
              `RCT-${receiptPayment._id ? String(receiptPayment._id).slice(-6) : "PAY"}`,
            createdAt: receiptPayment.createdAt || new Date(),
            guestName: receiptPayment.guestName || "Guest Payment",
            roomNumber: receiptPayment.roomNo || receiptPayment.roomNumber,
            bookingNo: receiptPayment.bookingNo || receiptPayment.folioNo,
            subtotal: receiptPayment.amount,
            totalAmount: receiptPayment.amount,
            items: [
              {
                name: `Payment - ${methodLabel(receiptPayment.method)}`,
                price: receiptPayment.amount,
                quantity: 1,
                notes: receiptPayment.referenceNo || receiptPayment.reference,
              },
            ],
            method: receiptPayment.method,
          }}
          onClose={() => setReceiptPayment(null)}
        />
      )}
    </>
  );
}

const METHOD_COLORS = ["#2879e8", "#1fb98e", "#f4a261", "#835de8", "#ec4899"];

function MethodBreakdown({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const gradient = useMemo(() => {
    if (!total) return "#e2e8f0";
    let acc = 0;
    const stops = items.map((item, index) => {
      const pct = (Number(item.amount || 0) / total) * 100;
      const start = acc;
      acc += pct;
      return `${METHOD_COLORS[index % METHOD_COLORS.length]} ${start.toFixed(1)}% ${acc.toFixed(1)}%`;
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
            <span className="font-normal text-gray-400">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 text-xs">
          {items.map((item, index) => (
            <div className="flex justify-between gap-2" key={item.method}>
              <span className="text-gray-600">
                <i
                  className={`mr-1.5 inline-block size-2 rounded-full ${["bg-blue-500", "bg-emerald-500", "bg-orange-400", "bg-violet-500", "bg-pink-500"][index % 5]}`}
                />
                {methodLabel(item.method)}
              </span>
              <strong className="text-brand-900 font-semibold">
                {money(item.amount)}
              </strong>
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
        <select className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 outline-none">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      }
    >
      <div className="flex h-32 items-end gap-2 border-b border-gray-100 px-2">
        {items.map((item) => (
          <div
            className="flex flex-1 flex-col items-center gap-1"
            key={`${item.label}-${item.amount}`}
          >
            <div
              className="bg-primary-500 w-full rounded-t transition-all"
              style={{
                height: `${Math.max((Number(item.amount || 0) / max) * 90, 8)}px`,
              }}
            />
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-gray-400">
        ● Collections
      </div>
    </Panel>
  );
}

function Reconciliation({ data, onRun }) {
  return (
    <Panel
      title="Reconciliation Summary"
      action={
        <button className="text-brand-700 hover:text-brand-900 text-xs font-semibold transition-colors">
          View Details
        </button>
      }
    >
      <div className="space-y-3 text-xs">
        <Summary label="PMS Collected" value={data.pmsCollected} green />
        <Summary label="Gateway Settled" value={data.gatewaySettled} />
        <Summary label="Bank Received" value={data.bankReceived} />
        <Summary label="Unreconciled" value={data.unreconciled} red />
        <Button
          variant="primary"
          className="w-full"
          icon={RefreshCcw}
          onClick={onRun}
        >
          Reconcile Now
        </Button>
        <p className="text-center text-[10px] text-gray-400">
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
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex justify-between border-b border-gray-100 pb-2.5">
        <h3 className="font-display text-brand-900 text-sm font-semibold">
          {title}
        </h3>
        <button className="text-brand-700 hover:text-brand-900 text-xs font-semibold transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-1">
        {rows.map((row, index) => (
          <div
            className="flex items-center gap-2.5 border-b border-gray-50 py-2 text-xs last:border-0"
            key={row._id || row.id || `${row.label}-${index}`}
          >
            <span
              className={`grid size-7 place-items-center rounded-lg ${refund ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-700"}`}
            >
              {refund ? <RefreshCcw size={13} /> : <CreditCard size={13} />}
            </span>
            <span className="mr-auto min-w-0">
              <strong className="text-brand-900 block truncate font-medium">
                {row.guestName || row.label}
              </strong>
              <span className="block truncate text-[11px] text-gray-400">
                {row.folioNo || row.detail || row.reason || "Payment"}
              </span>
            </span>
            <strong
              className={`shrink-0 font-semibold ${refund ? "text-rose-600" : "text-brand-900"}`}
            >
              {money(row.amount)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Alerts({ alerts }) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs shadow-xs">
      <strong className="font-semibold text-amber-800">
        🔔 Payment Alerts
      </strong>
      {alerts.map((alert) => (
        <div
          className="flex-1 border-l border-amber-200/80 pl-4"
          key={alert.label}
        >
          <b className="text-amber-900">{alert.count ?? money(alert.amount)}</b>
          <span className="ml-1 text-amber-800/80">{alert.label}</span>
          <button className="text-brand-900 hover:text-brand-700 ml-2 font-semibold">
            {alert.action} →
          </button>
        </div>
      ))}
    </section>
  );
}

function Summary({ label, value, green, red }) {
  return (
    <div
      className={`flex justify-between ${green ? "text-emerald-600" : ""} ${red ? "font-semibold text-rose-600" : "text-gray-600"}`}
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
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-brand-900 font-semibold">
              {selected.guestName || "Guest Payment"}
            </p>
            <p className="text-gray-400">
              Ref: {selected.referenceNo || selected.reference || "—"} · Folio:{" "}
              {selected.folioNo || "—"}
            </p>
            <p className="mt-1 font-bold text-emerald-600">
              {money(selected.amount)} ({methodLabel(selected.method)})
            </p>
          </div>
          <button
            type="button"
            className="text-brand-900 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-left font-medium transition-colors hover:bg-gray-50"
            onClick={() => {
              onOpenThermal?.(selected);
              onClose();
            }}
          >
            <span>Print 80mm POS Slip</span>
            <span className="bg-brand-50 text-brand-700 rounded px-2 py-0.5 text-[10px] font-semibold">
              Thermal
            </span>
          </button>
          <button
            type="button"
            className="text-brand-900 w-full rounded-xl border border-gray-200 bg-white p-3 text-left font-medium transition-colors hover:bg-gray-50"
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
          <label className="text-brand-900 block text-xs font-semibold">
            Payment method
            <select
              className="text-brand-900 mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-normal outline-none"
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
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </p>
      )}
    </ActionDrawer>
  );
}
