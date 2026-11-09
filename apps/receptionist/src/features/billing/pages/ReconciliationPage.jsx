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
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
} from "@hotelos/ui/components";
import { formatDate as date } from "@hotelos/utils";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, Panel, money } from "../billingUi.jsx";

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
      <div className="p-8 text-sm text-gray-500">Loading reconciliation…</div>
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
    <div>
      <Header
        pageTitle="Bank & Payment Reconciliation"
        pageDescription="Match and verify payments, folios, POS sales and bank deposits."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("import")}
            >
              <Upload size={14} /> Import Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-brand-900 hover:bg-brand-950 gap-2 text-white disabled:opacity-50"
              disabled={runningJob}
              onClick={async () => {
                setActionError("");
                setRunningJob(true);
                try {
                  await billingApi.runReconciliationJob({});
                  reload();
                } catch (error) {
                  setActionError(
                    error.message || "Reconciliation could not run",
                  );
                } finally {
                  setRunningJob(false);
                }
              }}
            >
              <Play size={14} />{" "}
              {runningJob ? "Running..." : "Run Reconciliation"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("lock")}
            >
              <LockKeyhole size={14} /> Lock Day
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {actionError && (
          <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <span>{actionError}</span>
            <button
              className="font-bold underline hover:text-rose-900"
              onClick={() => setActionError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        <KpiTileRow>
          <KpiTile
            title="Total System Revenue"
            value={money(data.metrics?.systemRevenue)}
            subtitle="Successful payments"
            icon={FileCheck2}
          />
          <KpiTile
            title="Bank Deposits"
            value={money(data.metrics?.bankDeposits)}
            subtitle="Imported external lines"
          />
          <KpiTile
            title="Expected Deposits"
            value={money(data.metrics?.expectedDeposits)}
            subtitle="Based on closed payments"
          />
          <KpiTile
            title="Variance"
            value={money(data.metrics?.variance)}
            subtitle="Needs attention"
          />
          <KpiTile
            title="Reconciled"
            value={`${data.metrics?.reconciledPercent || 0}%`}
            subtitle={`${data.metrics?.reconciled || 0} / ${data.metrics?.total || 0} transactions`}
            icon={CheckCircle2}
          />
        </KpiTileRow>

        <div className="flex flex-wrap gap-2">
          {["overview", "payment", "pos", "bank", "folio", "discrepancies"].map(
            (value) => (
              <button
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  tab === value
                    ? "bg-brand-900 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
                key={value}
                onClick={() => setTab(value)}
              >
                {value === "payment" ? "Payment Reconciliation" : value}
              </button>
            ),
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_280px]">
          <Panel title="Revenue vs Deposits">
            <Bars rows={data.methods} />
          </Panel>
          <Panel title="Payment Method Reconciliation">
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-1 text-[10px] font-semibold text-gray-500 uppercase">
                <span>Method</span>
                <span>System</span>
                <span>Bank</span>
                <span>Variance</span>
              </div>
              {(data.methods || []).map((row) => (
                <div
                  className="grid grid-cols-4 gap-2 border-b border-gray-50 py-1 last:border-0"
                  key={row.method}
                >
                  <span className="text-gray-700 capitalize">{row.method}</span>
                  <b className="text-gray-900">{money(row.system)}</b>
                  <b className="text-gray-900">{money(row.bank)}</b>
                  <span
                    className={
                      row.variance
                        ? "font-semibold text-rose-600"
                        : "font-semibold text-emerald-600"
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel title="Detailed Transactions">
            <div className="mb-4 flex gap-2">
              <label className="focus-within:ring-primary-500 flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 focus-within:ring-1">
                <Search size={14} />
                <input
                  className="min-w-0 flex-1 text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Search bill, folio, guest..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-200 text-gray-700"
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
                        `"${date(r.createdAt)}"`,
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
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
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
                      <th className="px-4 py-3" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((row) => (
                    <tr className="hover:bg-primary-50/20" key={row._id}>
                      <td className="px-4 py-3 text-gray-600">
                        {date(row.createdAt)}
                      </td>
                      <td className="text-brand-900 px-4 py-3 font-semibold">
                        {row.billId || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.guestName || "Guest"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize">
                        {row.method}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {money(row.amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                        {row.gatewayTxnId || row.reference || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          status={
                            row.status === "success" ? "matched" : "pending"
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 px-2 py-1 text-xs"
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
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!transactions.length && (
                <p className="p-8 text-center text-xs text-gray-400">
                  No transactions match the selected filter.
                </p>
              )}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title={`Discrepancies (${data.status?.discrepancy || 0})`}>
              <div className="space-y-2">
                {(data.discrepancies || []).map((row) => (
                  <button
                    className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-2 text-left text-xs transition-colors hover:bg-rose-50"
                    key={row.id}
                    onClick={() => {
                      setSelectedDiscrepancy(row);
                      setDrawer("resolve");
                    }}
                  >
                    <span className="truncate pr-2 font-medium text-gray-800">
                      {row.reason || row.reference || "Mismatch"}
                    </span>
                    <b className="shrink-0 text-rose-600">
                      {money(row.amount)}
                    </b>
                  </button>
                ))}
                {!data.discrepancies?.length && (
                  <p className="py-2 text-xs text-gray-400">
                    No discrepancies found.
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="Bank Deposit Summary">
              <p className="text-xs text-gray-500">
                Imported bank lines and settlement batches are compared against
                system revenue.
              </p>
              <div className="mt-4 flex justify-between border-b border-gray-50 py-1 text-xs">
                <span className="text-gray-600">Expected</span>
                <b className="text-gray-900">
                  {money(data.metrics?.expectedDeposits)}
                </b>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1 text-xs">
                <span className="text-gray-600">Deposited</span>
                <b className="text-gray-900">
                  {money(data.metrics?.bankDeposits)}
                </b>
              </div>
              <div className="flex justify-between py-1 pt-2 text-xs font-bold">
                <span className="text-brand-900">Variance</span>
                <b className="text-rose-600">{money(data.metrics?.variance)}</b>
              </div>
            </Panel>
          </div>
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
    <div className="flex h-36 items-end gap-4 pt-4">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1.5"
          key={row.method}
        >
          <div className="flex h-24 items-end gap-1.5">
            <div
              className="bg-primary-600 w-4 rounded-t transition-all"
              title={`System: ${money(row.system)}`}
              style={{ height: `${Math.max((row.system / max) * 90, 4)}px` }}
            />
            <div
              className="w-4 rounded-t bg-emerald-500 transition-all"
              title={`Bank: ${money(row.bank)}`}
              style={{ height: `${Math.max((row.bank / max) * 90, 4)}px` }}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-gray-500 capitalize">
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
        className="mx-auto grid size-28 place-items-center rounded-full shadow-inner"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
      >
        <div className="text-brand-900 grid size-16 place-items-center rounded-full bg-white text-xl font-bold shadow-sm">
          {total ? Math.round((matched / total) * 100) : 100}%
        </div>
      </div>
      <div className="mt-4 space-y-1.5 text-xs">
        <div className="flex justify-between border-b border-gray-50 py-1">
          <span className="text-gray-600">Reconciled</span>
          <b className="text-emerald-600">{matched}</b>
        </div>
        <div className="flex justify-between border-b border-gray-50 py-1">
          <span className="text-gray-600">Pending</span>
          <b className="text-amber-600">{pending}</b>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Discrepancy</span>
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
          const [dateVal, amount, reference, method] = line
            .split(",")
            .map((s) => s.trim());
          return {
            date: dateVal,
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
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field
        label="CSV rows (Date, Amount, Reference, Method)"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="2026-11-05, 4500, TXN12345, bank_transfer"
      />
      <p className="bg-primary-50 border-primary-100 text-primary-800 rounded-lg border p-3 text-xs">
        Paste CSV rows or use the bank export format. Imported lines remain
        pending until reconciliation runs.
      </p>
    </ActionDrawer>
  );
}

function LockDrawer({ onClose, onComplete }) {
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.lockReconciliation({ businessDate: dateVal });
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
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field
        label="Business date"
        type="date"
        value={dateVal}
        onChange={(event) => setDateVal(event.target.value)}
      />
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
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
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
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
