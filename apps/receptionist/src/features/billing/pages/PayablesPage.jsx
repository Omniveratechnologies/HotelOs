import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
} from "@hotelos/ui/components";
import { formatDate as date, formatCurrency as money } from "@hotelos/utils";
import { billingApi } from "../api/billingApi.js";
import { ActionDrawer, Field, Panel, BillingPageSkeleton } from "../components";

const tabs = [
  ["all", "All Bills"],
  ["pending", "Pending"],
  ["overdue", "Overdue"],
  ["paid", "Paid"],
  ["draft", "Drafts"],
];

const downloadCsv = (rows, name) => {
  const csv = rows.length
    ? [
        Object.keys(rows[0]).join(","),
        ...rows.map((row) =>
          Object.values(row)
            .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
            .join(","),
        ),
      ].join("\n")
    : "No data";
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function PayablesPage() {
  const query = useQuery({
    queryKey: ["billing", "payables"],
    queryFn: () => billingApi.payablesSummary(),
  });
  const data = query.data || {};
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState("");
  const [selected, setSelected] = useState([]);
  const [now] = useState(() => Date.now());

  const rows = useMemo(
    () =>
      (data.rows || []).filter(
        (row) =>
          (tab === "all" || row.status === tab) &&
          `${row.vendorName} ${row.billNo} ${row.category}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data.rows, search, tab],
  );

  const reload = () => {
    setDrawer("");
    query.refetch();
  };

  return (
    <div>
      <Header
        pageTitle="Accounts Payable & Vendor Bills"
        pageDescription="Manage vendor bills, supplier payments and outstanding liabilities."
      >
        <Button
          variant="primary"
          size="sm"
          className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
          onClick={() => setDrawer("bill")}
          disabled={query.isLoading}
        >
          <Plus size={14} /> Add Bill
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        {/* Page Top Secondary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Vendor liabilities, pending bills, and bulk settlement.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("payment")}
              disabled={query.isLoading}
            >
              <Wallet size={14} /> Record Payment
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("bulk")}
              disabled={query.isLoading}
            >
              <Receipt size={14} /> Bulk Payment
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => downloadCsv(data.rows || [], "payables.csv")}
              disabled={query.isLoading}
            >
              <Download size={14} /> Export
            </Button>
          </div>
        </div>

        {query.isError ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            Payables could not be loaded.
          </div>
        ) : query.isLoading ? (
          <BillingPageSkeleton kpis={4} tableRows={6} />
        ) : (
          <>
            <KpiTileRow>
              <KpiTile
                title="Total Payables"
                value={money(data.metrics?.totalPayables)}
                subtitle={`Across ${data.metrics?.supplierCount || 0} suppliers`}
                icon={Receipt}
              />
              <KpiTile
                title="Pending Payments"
                value={money(data.metrics?.pendingPayments)}
                subtitle="Bills awaiting payment"
                icon={CalendarClock}
              />
              <KpiTile
                title="Paid This Month"
                value={money(data.metrics?.paidThisMonth)}
                subtitle="Vendor payments"
                icon={CheckCircle2}
              />
              <KpiTile
                title="Overdue Amount"
                value={money(data.metrics?.overdueAmount)}
                subtitle={`${data.metrics?.overdueCount || 0} bills overdue`}
                icon={CalendarClock}
              />
            </KpiTileRow>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr_300px]">
              <Panel title="Payables by Category">
                <Donut rows={data.category} />
              </Panel>
              <Panel title="Monthly Payables Trend">
                <Trend rows={data.trend} />
              </Panel>
              <Panel title="Payables by Status">
                <StatusChart rows={data.status} />
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Panel title="All Payables">
                <div className="mb-4 flex flex-wrap gap-2">
                  <label className="focus-within:ring-primary-500 flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 focus-within:ring-1">
                    <Search size={14} />
                    <input
                      className="min-w-0 flex-1 text-gray-900 placeholder-gray-400 outline-none"
                      placeholder="Search vendor, invoice no..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-gray-200 text-gray-700"
                    onClick={() => downloadCsv(rows, "payables-filtered.csv")}
                  >
                    <Download size={14} /> Export
                  </Button>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {tabs.map(([value, label]) => (
                    <button
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        tab === value
                          ? "bg-brand-900 text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                      key={value}
                      onClick={() => setTab(value)}
                    >
                      {label} (
                      {
                        (data.rows || []).filter(
                          (row) => value === "all" || row.status === value,
                        ).length
                      }
                      )
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[820px] text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                            onChange={(event) =>
                              setSelected(
                                event.target.checked
                                  ? rows.map((row) => row.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        {[
                          "Invoice No.",
                          "Vendor Name",
                          "Category",
                          "Invoice Date",
                          "Due Date",
                          "Amount",
                          "Paid",
                          "Balance",
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
                      {rows.map((row) => (
                        <tr className="hover:bg-primary-50/20" key={row.id}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                              checked={selected.includes(row.id)}
                              onChange={() =>
                                setSelected(
                                  selected.includes(row.id)
                                    ? selected.filter((id) => id !== row.id)
                                    : [...selected, row.id],
                                )
                              }
                            />
                          </td>
                          <td className="text-primary-700 px-4 py-3 font-semibold">
                            {row.billNo || row.invoiceNo || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {row.vendorName || row.vendor || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.category || "General"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {date(row.billDate)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {date(row.dueDate)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {money(row.amount)}
                          </td>
                          <td className="px-4 py-3 text-emerald-700">
                            {money(row.paid)}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {money(row.balance)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip status={row.status} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                              onClick={() => {
                                setSelected([row.id]);
                                setDrawer("payment");
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
                    <p className="p-8 text-center text-xs text-gray-400">
                      No payable bills match these filters.
                    </p>
                  )}
                </div>
              </Panel>

              <div className="space-y-6">
                <Panel title="Upcoming Payments">
                  <div className="space-y-3">
                    {(data.upcoming || []).map((row) => (
                      <div
                        className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                        key={row.id}
                      >
                        <span>
                          <b className="block text-gray-900">
                            {row.vendorName || "Supplier"}
                          </b>
                          <small className="text-gray-400">
                            Due in{" "}
                            {Math.max(
                              0,
                              Math.ceil(
                                (new Date(row.dueDate) - now) / 86400000,
                              ),
                            )}{" "}
                            days
                          </small>
                        </span>
                        <b className="text-gray-900">{money(row.balance)}</b>
                      </div>
                    ))}
                    {!data.upcoming?.length && (
                      <p className="py-2 text-xs text-gray-400">
                        No upcoming payments due.
                      </p>
                    )}
                  </div>
                </Panel>

                <Panel title="Recent Payments">
                  <div className="space-y-3">
                    {(data.recentPayments || []).slice(0, 6).map((row) => (
                      <div
                        className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                        key={row.id}
                      >
                        <span>
                          <span className="font-medium text-gray-800">
                            {row.vendorName || "Supplier"}
                          </span>
                          <small className="block text-gray-400">
                            {row.paymentMode || "Bank transfer"}
                          </small>
                        </span>
                        <b className="text-emerald-700">{money(row.paid)}</b>
                      </div>
                    ))}
                    {!data.recentPayments?.length && (
                      <p className="py-2 text-xs text-gray-400">
                        No recent payments.
                      </p>
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>

      {drawer === "bill" && (
        <BillDrawer onClose={() => setDrawer("")} onComplete={reload} />
      )}
      {drawer === "payment" && (
        <PaymentDrawer
          ids={selected}
          rows={rows}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
      {drawer === "bulk" && (
        <PaymentDrawer
          ids={selected}
          rows={rows}
          bulk
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
    </div>
  );
}

function Donut({ rows = [] }) {
  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const colors = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#64748b",
  ];
  let currentPercent = 0;
  const gradientParts =
    rows.length && total > 0
      ? rows
          .map((row, idx) => {
            const pct = ((Number(row.amount) || 0) / total) * 100;
            const start = currentPercent;
            currentPercent += pct;
            const color = colors[idx % colors.length];
            return `${color} ${start.toFixed(1)}% ${currentPercent.toFixed(1)}%`;
          })
          .join(", ")
      : "#cbd5e1 0% 100%";

  return (
    <div className="flex items-center gap-6">
      <div
        className="grid size-28 shrink-0 place-items-center rounded-full shadow-inner"
        style={{
          background: `conic-gradient(${gradientParts})`,
        }}
      >
        <div className="text-brand-900 grid size-16 place-items-center rounded-full bg-white text-center text-xs font-bold shadow-sm">
          {money(total)}
        </div>
      </div>
      <div className="flex-1 space-y-1.5 text-xs">
        {rows.map((row, idx) => (
          <div
            className="flex items-center justify-between gap-4"
            key={row.category || idx}
          >
            <span className="flex items-center gap-1.5 truncate text-gray-600">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              {row.category}
            </span>
            <b className="text-gray-900">{money(row.amount)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trend({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.bills), 1);
  return (
    <div className="flex h-32 items-end gap-2 pt-4">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1.5"
          key={row.month}
        >
          <div
            className="bg-primary-600 w-full rounded-t transition-all"
            style={{ height: `${Math.max((row.bills / max) * 85, 6)}px` }}
          />
          <span className="w-full truncate text-center text-[10px] text-gray-500">
            {row.month}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusChart({ rows = [] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.status}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-600 capitalize">{row.status}</span>
            <b className="text-gray-900">{row.count}</b>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${Math.min(row.count * 10, 100)}%` }}
            />
          </div>
        </div>
      ))}
      {!rows.length && (
        <p className="py-2 text-xs text-gray-400">No status data.</p>
      )}
    </div>
  );
}

function BillDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({
    approvalStatus: "submitted",
    category: "Food & Beverages",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.createPayable({
        ...form,
        amount: Number(form.amount) || 0,
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Bill could not be saved");
    } finally {
      setLoading(false);
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Vendor Bill"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Saving..." : "Save Bill"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field
        label="Bill number"
        required
        value={form.billNo || ""}
        onChange={set("billNo")}
      />
      <Field
        label="Vendor name"
        required
        value={form.vendorName || ""}
        onChange={set("vendorName")}
      />
      <Field label="Category">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.category}
          onChange={set("category")}
        >
          <option>Food &amp; Beverages</option>
          <option>Utilities</option>
          <option>Housekeeping</option>
          <option>Maintenance</option>
          <option>Marketing</option>
          <option>Others</option>
        </select>
      </Field>
      <Field
        label="Bill date"
        type="date"
        value={form.billDate || ""}
        onChange={set("billDate")}
      />
      <Field
        label="Due date"
        type="date"
        value={form.dueDate || ""}
        onChange={set("dueDate")}
      />
      <Field
        label="Total amount (₹)"
        type="number"
        required
        value={form.amount || ""}
        onChange={set("amount")}
      />
      <Field label="Save as">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.approvalStatus}
          onChange={set("approvalStatus")}
        >
          <option value="submitted">Submit for approval</option>
          <option value="draft">Draft</option>
        </select>
      </Field>
    </ActionDrawer>
  );
}

function PaymentDrawer({ ids = [], rows = [], bulk, onClose, onComplete }) {
  const selected = rows.filter((row) => ids.includes(row.id));
  const defaultTotal = selected.reduce(
    (sum, r) => sum + (Number(r.balance) || Number(r.amount) || 0),
    0,
  );
  const [form, setForm] = useState({
    amount: defaultTotal > 0 ? defaultTotal : "",
    mode: "bank_transfer",
    reference: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const allocations = selected
      .map((row) => ({
        billId: row.id,
        amount: Math.min(
          Number(form.amount || 0),
          row.balance || row.amount || 0,
        ),
      }))
      .filter((row) => row.amount > 0);
    try {
      await billingApi.createVendorPayment({
        ...form,
        amount: Number(form.amount) || 0,
        allocations: bulk ? allocations : allocations.slice(0, 1),
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Payment could not be recorded");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title={bulk ? "Bulk Vendor Payment" : "Record Vendor Payment"}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Recording..." : "Record Payment"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field
        label="Amount (₹)"
        type="number"
        required
        value={form.amount}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Payment mode">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.mode}
          onChange={(event) => setForm({ ...form, mode: event.target.value })}
        >
          <option value="bank_transfer">Bank transfer / NEFT</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
        </select>
      </Field>
      <Field
        label="Reference / Transaction ID"
        required
        value={form.reference}
        onChange={(event) =>
          setForm({ ...form, reference: event.target.value })
        }
      />
      <p className="bg-primary-50 border-primary-100 text-primary-800 rounded-lg border p-3 text-xs">
        {selected.length
          ? `${selected.length} bill(s) selected (${money(defaultTotal)}) for oldest-first allocation.`
          : "Select bills from the table before recording a payment."}
      </p>
    </ActionDrawer>
  );
}
