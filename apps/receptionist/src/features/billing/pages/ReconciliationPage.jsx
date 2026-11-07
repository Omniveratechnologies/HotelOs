import { useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  CheckCircle2,
  Download,
  FileCheck2,
  LockKeyhole,
  Play,
  Search,
  Upload,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import {
  ActionDrawer,
  Field,
  KpiCard,
  Panel,
  StatusPill,
  money,
} from "../billingUi.jsx";

const button =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c]";

export default function ReconciliationPage() {
  const query = useQuery({
    queryKey: ["billing", "reconciliation"],
    queryFn: () => billingApi.reconciliationSummary(),
  });
  const data = query.data || {};
  const [tab, setTab] = useState("overview");
  const [drawer, setDrawer] = useState("");
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  const [search, setSearch] = useState("");
  const [runningJob, setRunningJob] = useState(false);
  const [actionError, setActionError] = useState("");

  const reload = () => {
    setDrawer("");
    setSelectedDiscrepancy(null);
    query.refetch();
  };
  if (query.isLoading)
    return (
      <div className="p-8 text-sm text-slate-500">Loading reconciliation…</div>
    );
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Reconciliation data could not be loaded.
      </div>
    );

  const transactions = (data.transactions || []).filter((row) => {
    const matchesSearch =
      `${row.billId || ""} ${row.guestName || ""} ${row.reference || ""} ${row.method || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (tab === "payment") {
      return ["cash", "card", "upi", "bank_transfer"].includes(
        (row.method || "").toLowerCase(),
      );
    }
    if (tab === "pos") {
      return (
        row.source === "pos" ||
        (row.category || "").toLowerCase().includes("pos") ||
        (row.billId || "").startsWith("POS")
      );
    }
    if (tab === "bank") {
      return (
        row.method === "bank_transfer" ||
        row.source === "bank" ||
        (row.gatewayTxnId || "").length > 0
      );
    }
    if (tab === "folio") {
      return row.folioId || row.roomNo || (row.billId || "").startsWith("FL");
    }
    if (tab === "discrepancies") {
      return row.status === "discrepancy" || row.status === "pending";
    }
    return true;
  });

  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-xs text-red-700">
          <span>{actionError}</span>
          <button
            className="font-bold underline"
            onClick={() => setActionError("")}
          >
            Dismiss
          </button>
        </div>
      )}
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Reconciliation
          </div>
          <h1 className="text-2xl font-bold">Reconciliation</h1>
          <p className="text-xs text-slate-500">
            Match and verify payments, folios, POS sales and bank deposits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={button} onClick={() => setDrawer("import")}>
            <Upload size={14} /> Import Data
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            disabled={runningJob}
            onClick={async () => {
              setActionError("");
              setRunningJob(true);
              try {
                await billingApi.runReconciliationJob({});
                reload();
              } catch (error) {
                setActionError(error.message || "Reconciliation could not run");
              } finally {
                setRunningJob(false);
              }
            }}
          >
            <Play size={14} />{" "}
            {runningJob ? "Running..." : "Run Reconciliation"}
          </button>
          <button className={button} onClick={() => setDrawer("lock")}>
            <LockKeyhole size={14} /> Lock Day
          </button>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total System Revenue"
          value={money(data.metrics?.systemRevenue)}
          detail="Successful payments"
          icon={FileCheck2}
        />
        <KpiCard
          label="Bank Deposits"
          value={money(data.metrics?.bankDeposits)}
          detail="Imported external lines"
          tone="green"
        />
        <KpiCard
          label="Expected Deposits"
          value={money(data.metrics?.expectedDeposits)}
          detail="Based on closed payments"
          tone="purple"
        />
        <KpiCard
          label="Variance"
          value={money(data.metrics?.variance)}
          detail="Needs attention"
          tone="amber"
        />
        <KpiCard
          label="Reconciled"
          value={`${data.metrics?.reconciledPercent || 0}%`}
          detail={`${data.metrics?.reconciled || 0} / ${data.metrics?.total || 0} transactions`}
          tone="red"
          icon={CheckCircle2}
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {["overview", "payment", "pos", "bank", "folio", "discrepancies"].map(
          (value) => (
            <button
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab === value ? "bg-[#102b5c] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
              key={value}
              onClick={() => setTab(value)}
            >
              {value === "payment" ? "Payment Reconciliation" : value}
            </button>
          ),
        )}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_280px]">
        <Panel title="Revenue vs Deposits">
          <Bars rows={data.methods} />
        </Panel>
        <Panel title="Payment Method Reconciliation">
          <div className="space-y-3 text-xs">
            {(data.methods || []).map((row) => (
              <div className="grid grid-cols-4 gap-2" key={row.method}>
                <span className="capitalize">{row.method}</span>
                <b>{money(row.system)}</b>
                <b>{money(row.bank)}</b>
                <span
                  className={
                    row.variance ? "text-rose-600" : "text-emerald-600"
                  }
                >
                  {money(row.variance)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Reconciliation Status">
          <StatusSummary status={data.status} />
        </Panel>
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Detailed Transactions">
          <div className="mb-3 flex gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search size={14} />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search bill, folio, guest..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className={button}
              onClick={() => {
                if (!transactions.length) return;
                const headers = [
                  "Date",
                  "Bill No",
                  "Guest",
                  "Method",
                  "Amount",
                  "Reference",
                  "Status",
                ];
                const csv = [
                  headers.join(","),
                  ...transactions.map((r) =>
                    [
                      `"${new Date(r.createdAt).toLocaleDateString("en-IN")}"`,
                      `"${r.billId || ""}"`,
                      `"${r.guestName || "Guest"}"`,
                      `"${r.method || ""}"`,
                      r.amount || 0,
                      `"${r.gatewayTxnId || r.reference || ""}"`,
                      `"${r.status || ""}"`,
                    ].join(","),
                  ),
                ].join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `reconciliation-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              }}
            >
              <Download size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[11px]">
              <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  {[
                    "Date & Time",
                    "Bill No.",
                    "Guest / Room",
                    "Method",
                    "Amount",
                    "Reference",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <th className="px-3 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => (
                  <tr className="border-b border-slate-50" key={row._id}>
                    <td className="px-3 py-3">
                      {new Date(row.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {row.billId || "—"}
                    </td>
                    <td className="px-3 py-3">{row.guestName || "Guest"}</td>
                    <td className="px-3 py-3 capitalize">{row.method}</td>
                    <td className="px-3 py-3 font-bold">{money(row.amount)}</td>
                    <td className="px-3 py-3">
                      {row.gatewayTxnId || row.reference || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill
                        value={row.status === "success" ? "matched" : "pending"}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-slate-200 px-2 py-1 text-[10px] hover:bg-slate-100"
                        onClick={() => {
                          setSelectedDiscrepancy({
                            id: row._id || row.id,
                            reference:
                              row.gatewayTxnId || row.reference || row.billId,
                            amount: row.amount,
                            reason: `Verification for ${row.billId || "payment"} (${row.guestName || "Guest"})`,
                          });
                          setDrawer("resolve");
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title={`Discrepancies (${data.status?.discrepancy || 0})`}>
            <div className="space-y-3">
              {(data.discrepancies || []).map((row) => (
                <button
                  className="flex w-full items-center justify-between rounded-lg p-1.5 text-left text-xs transition-colors hover:bg-rose-50/50"
                  key={row.id}
                  onClick={() => {
                    setSelectedDiscrepancy(row);
                    setDrawer("resolve");
                  }}
                >
                  <span className="truncate pr-2">
                    {row.reason || row.reference || "Mismatch"}
                  </span>
                  <b className="shrink-0 text-rose-600">{money(row.amount)}</b>
                </button>
              ))}
              {!data.discrepancies?.length && (
                <p className="text-xs text-slate-400">
                  No discrepancies found.
                </p>
              )}
            </div>
          </Panel>
          <Panel title="Bank Deposit Summary">
            <p className="text-xs text-slate-500">
              Imported bank lines and settlement batches are compared against
              system revenue.
            </p>
            <div className="mt-3 flex justify-between text-xs">
              <span>Expected</span>
              <b>{money(data.metrics?.expectedDeposits)}</b>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span>Deposited</span>
              <b>{money(data.metrics?.bankDeposits)}</b>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span>Variance</span>
              <b className="text-rose-600">{money(data.metrics?.variance)}</b>
            </div>
          </Panel>
        </div>
      </div>
      {drawer === "import" && (
        <ImportDrawer onClose={() => setDrawer("")} onComplete={reload} />
      )}
      {drawer === "lock" && (
        <LockDrawer onClose={() => setDrawer("")} onComplete={reload} />
      )}
      {drawer === "resolve" && (
        <ResolveDrawer
          discrepancy={selectedDiscrepancy || data.discrepancies?.[0]}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
    </div>
  );
}

function Bars({ rows = [] }) {
  const max = Math.max(...rows.map((row) => Math.max(row.system, row.bank)), 1);
  return (
    <div className="flex h-32 items-end gap-3">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1"
          key={row.method}
        >
          <div className="flex h-24 items-end gap-1">
            <div
              className="w-4 rounded-t bg-blue-500"
              style={{ height: `${Math.max((row.system / max) * 90, 4)}px` }}
            />
            <div
              className="w-4 rounded-t bg-emerald-400"
              style={{ height: `${Math.max((row.bank / max) * 90, 4)}px` }}
            />
          </div>
          <span className="text-[9px] text-slate-500 capitalize">
            {row.method}
          </span>
        </div>
      ))}
    </div>
  );
}
function StatusSummary({ status = {} }) {
  const matched = Number(status.matched || 0);
  const pending = Number(status.pending || 0);
  const discrepancy = Number(status.discrepancy || 0);
  const total = matched + pending + discrepancy;

  let gradient = "#cbd5e1 0% 100%";
  if (total > 0) {
    const matchedPct = (matched / total) * 100;
    const pendingPct = (pending / total) * 100;
    const p1 = matchedPct;
    const p2 = matchedPct + pendingPct;
    gradient = `#10b981 0% ${p1.toFixed(1)}%, #f59e0b ${p1.toFixed(1)}% ${p2.toFixed(1)}%, #ef4444 ${p2.toFixed(1)}% 100%`;
  }

  return (
    <div className="text-center">
      <div
        className="mx-auto grid size-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
      >
        <div className="grid size-16 place-items-center rounded-full bg-white text-xl font-bold">
          {total ? Math.round((matched / total) * 100) : 100}%
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Reconciled</span>
          <b className="text-emerald-600">{matched}</b>
        </div>
        <div className="flex justify-between">
          <span>Pending</span>
          <b className="text-amber-600">{pending}</b>
        </div>
        <div className="flex justify-between">
          <span>Discrepancy</span>
          <b className="text-rose-600">{discrepancy}</b>
        </div>
      </div>
    </div>
  );
}
function ImportDrawer({ onClose, onComplete }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const rows = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [date, amount, reference, method] = line
            .split(",")
            .map((s) => s.trim());
          return {
            date,
            amount: Number(amount) || 0,
            reference,
            method: method || "bank_transfer",
            source: "bank",
          };
        });
      if (!rows.length) {
        throw new Error("Please enter at least one valid CSV row.");
      }
      await billingApi.importReconciliation({ rows });
      onComplete();
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Import Bank / Gateway Data"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Importing..." : "Import Transactions"}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">
          {error}
        </div>
      )}
      <Field
        label="CSV rows (Date, Amount, Reference, Method)"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="2026-11-05, 4500, TXN12345, bank_transfer"
      />
      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        Paste CSV rows or use the bank export format. Imported lines remain
        pending until reconciliation runs.
      </p>
    </ActionDrawer>
  );
}
function LockDrawer({ onClose, onComplete }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.lockReconciliation({ businessDate: date });
      onComplete();
    } catch (err) {
      setError(err.message || "Day could not be locked");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Lock Reconciliation Day"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Locking..." : "Lock Day"}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">
          {error}
        </div>
      )}
      <Field
        label="Business date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        Locked days cannot be changed without manager unlock and an audit entry.
      </p>
    </ActionDrawer>
  );
}
function ResolveDrawer({ discrepancy, onClose, onComplete }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!discrepancy?.id) return onClose();
    setError("");
    setLoading(true);
    try {
      await billingApi.resolveDiscrepancy(discrepancy.id, { note });
      onComplete();
    } catch (err) {
      setError(err.message || "Discrepancy could not be resolved");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Resolve Discrepancy"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Resolving..." : "Mark Matched"}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">
          {error}
        </div>
      )}
      <div className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
        <b className="block font-semibold">
          {discrepancy?.reference || "Discrepancy Item"}
        </b>
        {discrepancy?.reason ||
          "Review the system and external transaction before resolving."}
        {discrepancy?.amount && (
          <div className="mt-1 font-bold">
            Amount: {money(discrepancy.amount)}
          </div>
        )}
      </div>
      <Field
        label="Resolution note"
        required
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </ActionDrawer>
  );
}
