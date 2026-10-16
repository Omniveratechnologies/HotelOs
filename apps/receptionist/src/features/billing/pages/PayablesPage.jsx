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
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm";
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
  if (query.isLoading)
    return <div className="p-8 text-sm text-slate-500">Loading payables…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Payables could not be loaded.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Payables
          </div>
          <h1 className="text-2xl font-bold">Payables</h1>
          <p className="text-xs text-slate-500">
            Manage vendor bills, supplier payments and outstanding liabilities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => setDrawer("bill")}
          >
            <Plus size={14} /> Add Bill
          </button>
          <button className={button} onClick={() => setDrawer("payment")}>
            <Wallet size={14} /> Record Payment
          </button>
          <button className={button} onClick={() => setDrawer("bulk")}>
            <Receipt size={14} /> Bulk Payment
          </button>
          <button
            className={button}
            onClick={() => downloadCsv(data.rows || [], "payables.csv")}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Payables"
          value={money(data.metrics?.totalPayables)}
          detail={`Across ${data.metrics?.supplierCount || 0} suppliers`}
          icon={Receipt}
        />
        <KpiCard
          label="Pending Payments"
          value={money(data.metrics?.pendingPayments)}
          detail="Bills awaiting payment"
          tone="amber"
          icon={CalendarClock}
        />
        <KpiCard
          label="Paid This Month"
          value={money(data.metrics?.paidThisMonth)}
          detail="Vendor payments"
          tone="green"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Overdue Amount"
          value={money(data.metrics?.overdueAmount)}
          detail={`${data.metrics?.overdueCount || 0} bills overdue`}
          tone="purple"
          icon={CalendarClock}
        />
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-[1fr_1fr_270px]">
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
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
        <Panel title="All Payables">
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search size={14} />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search vendor, invoice no..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className={button}
              onClick={() => downloadCsv(rows, "payables-filtered.csv")}
            >
              <Download size={14} /> Export
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {tabs.map(([value, label]) => (
              <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === value ? "bg-[#102b5c] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[11px]">
              <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      onChange={(event) =>
                        setSelected(
                          event.target.checked ? rows.map((row) => row.id) : [],
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
                    <th className="px-3 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className="border-b border-slate-50 hover:bg-blue-50/40"
                    key={row.id}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
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
                    <td className="px-3 py-3 font-semibold text-blue-700">
                      {row.billNo || row.invoiceNo || "—"}
                    </td>
                    <td className="px-3 py-3">
                      {row.vendorName || row.vendor || "—"}
                    </td>
                    <td className="px-3 py-3">{date(row.billDate)}</td>
                    <td className="px-3 py-3">{date(row.dueDate)}</td>
                    <td className="px-3 py-3 font-semibold">
                      {money(row.amount)}
                    </td>
                    <td className="px-3 py-3">{money(row.paid)}</td>
                    <td className="px-3 py-3 font-bold">
                      {money(row.balance)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.status} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-slate-200 p-1"
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
              <p className="p-8 text-center text-xs text-slate-400">
                No payable bills match these filters.
              </p>
            )}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Upcoming Payments">
            <div className="space-y-3">
              {(data.upcoming || []).map((row) => (
                <div className="flex justify-between text-xs" key={row.id}>
                  <span>
                    <b className="block">{row.vendorName || "Supplier"}</b>
                    <small className="text-slate-400">
                      Due in{" "}
                      {Math.max(
                        0,
                        Math.ceil((new Date(row.dueDate) - now) / 86400000),
                      )}{" "}
                      days
                    </small>
                  </span>
                  <b>{money(row.balance)}</b>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent Payments">
            <div className="space-y-3">
              {(data.recentPayments || []).slice(0, 6).map((row) => (
                <div className="flex justify-between text-xs" key={row.id}>
                  <span>
                    {row.vendorName || "Supplier"}
                    <small className="block text-slate-400">
                      {row.paymentMode || "Bank transfer"}
                    </small>
                  </span>
                  <b>{money(row.paid)}</b>
                </div>
              ))}
            </div>
          </Panel>
        </div>
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

function date(value) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}
function Donut({ rows = [] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-24 place-items-center rounded-full"
        style={{
          background:
            "conic-gradient(#2563eb 0 32%, #10b981 32% 50%, #f59e0b 50% 68%, #8b5cf6 68% 81%, #ec4899 81% 100%)",
        }}
      >
        <div className="grid size-14 place-items-center rounded-full bg-white text-center text-[10px] font-bold">
          {money(total)}
        </div>
      </div>
      <div className="space-y-1 text-[10px]">
        {rows.map((row) => (
          <div className="flex justify-between gap-5" key={row.category}>
            <span>{row.category}</span>
            <b>{money(row.amount)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function Trend({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.bills), 1);
  return (
    <div className="flex h-28 items-end gap-2">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1"
          key={row.month}
        >
          <div
            className="w-full rounded-t bg-blue-400"
            style={{ height: `${Math.max((row.bills / max) * 80, 4)}px` }}
          />
          <span className="text-[9px] text-slate-400">{row.month}</span>
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
          <div className="mb-1 flex justify-between text-[10px]">
            <span className="capitalize">{row.status}</span>
            <b>{row.count}</b>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-400"
              style={{ width: `${Math.min(row.count * 10, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function BillDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({ approvalStatus: "submitted" });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.createPayable(form);
      onComplete();
    } catch (error) {
      window.alert(error.message || "Bill could not be saved");
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Vendor Bill"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Save Bill"
    >
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
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.category || "Food & Beverages"}
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
        label="Total amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={set("amount")}
      />
      <Field label="Save as">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
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
function PaymentDrawer({ ids, rows, bulk, onClose, onComplete }) {
  const selected = rows.filter((row) => ids.includes(row.id));
  const [form, setForm] = useState({});
  const submit = async (event) => {
    event.preventDefault();
    const allocations = selected
      .map((row) => ({
        billId: row.id,
        amount: Math.min(Number(form.amount || 0), row.balance),
      }))
      .filter((row) => row.amount > 0);
    try {
      await billingApi.createVendorPayment({
        ...form,
        allocations: bulk ? allocations : allocations.slice(0, 1),
      });
      onComplete();
    } catch (error) {
      window.alert(error.message || "Payment could not be recorded");
    }
  };
  return (
    <ActionDrawer
      title={bulk ? "Bulk Vendor Payment" : "Record Vendor Payment"}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Record Payment"
    >
      <Field
        label="Amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Payment mode">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.mode || "bank_transfer"}
          onChange={(event) => setForm({ ...form, mode: event.target.value })}
        >
          <option value="bank_transfer">Bank transfer / NEFT</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
        </select>
      </Field>
      <Field
        label="Reference"
        required
        value={form.reference || ""}
        onChange={(event) =>
          setForm({ ...form, reference: event.target.value })
        }
      />
      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        {selected.length
          ? `${selected.length} bill(s) selected for oldest-first allocation.`
          : "Select bills from the table before recording a payment."}
      </p>
    </ActionDrawer>
  );
}
