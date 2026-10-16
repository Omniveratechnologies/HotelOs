import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  Download,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Upload,
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
  ["all", "All"],
  ["paid", "Paid"],
  ["pending", "Pending"],
  ["overdue", "Overdue"],
  ["recurring", "Recurring"],
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

export default function ExpensesPage() {
  const query = useQuery({
    queryKey: ["billing", "expenses"],
    queryFn: () => billingApi.expensesSummary(),
  });
  const data = query.data || {};
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState("");
  const rows = useMemo(
    () =>
      (data.rows || []).filter(
        (row) =>
          (tab === "all" ||
            (tab === "recurring"
              ? row.recurringId
              : row.status === tab || row.paymentStatus === tab)) &&
          `${row.description} ${row.vendorName} ${row.category}`
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
    return <div className="p-8 text-sm text-slate-500">Loading expenses…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Expenses could not be loaded.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Expenses
          </div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-xs text-slate-500">
            Track and manage hotel expenses, vendor payments and operational
            costs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => setDrawer("expense")}
          >
            <Plus size={14} /> Add Expense
          </button>
          <button className={button} onClick={() => setDrawer("upload")}>
            <Upload size={14} /> Upload Bills
          </button>
          <button
            className={button}
            onClick={() => downloadCsv(data.rows || [], "expenses.csv")}
          >
            <Download size={14} /> Export
          </button>
          <button className={`${button} px-2`}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Expenses This Month"
          value={money(data.metrics?.total)}
          detail="vs last month"
          icon={Receipt}
        />
        <KpiCard
          label="Paid Expenses"
          value={money(data.metrics?.paid)}
          detail="Recorded payments"
          tone="green"
          icon={Wallet}
        />
        <KpiCard
          label="Pending Payments"
          value={money(data.metrics?.pending)}
          detail="Also in Payables"
          tone="amber"
        />
        <KpiCard
          label="Total Vendors"
          value={data.metrics?.vendors || 0}
          detail="Active vendors"
          tone="purple"
        />
        <KpiCard
          label="Average Monthly Expense"
          value={money(data.metrics?.average)}
          detail="Last 6 months"
          tone="blue"
        />
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_270px]">
        <Panel title="Expense Trend">
          <Trend rows={data.trend} />
        </Panel>
        <Panel title="Expenses by Category">
          <Donut rows={data.category} />
        </Panel>
        <Panel title="Top Expense Categories">
          <Bars rows={data.category} />
        </Panel>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
        <Panel title="All Expenses">
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search size={14} />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search by description, vendor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className={button}
              onClick={() => downloadCsv(rows, "expenses-filtered.csv")}
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
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[11px]">
              <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  {[
                    "Date",
                    "Description",
                    "Category",
                    "Vendor",
                    "Payment Method",
                    "Amount",
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
                      {row.date
                        ? new Date(row.date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {row.description}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                        {row.category || "Others"}
                      </span>
                    </td>
                    <td className="px-3 py-3">{row.vendorName || "—"}</td>
                    <td className="px-3 py-3">{row.paymentMethod || "—"}</td>
                    <td className="px-3 py-3 font-bold">{money(row.amount)}</td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.status || row.paymentStatus} />
                    </td>
                    <td className="px-3 py-3">
                      <button className="rounded border border-slate-200 p-1">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="p-8 text-center text-xs text-slate-400">
                No expenses match these filters.
              </p>
            )}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Recent Expenses">
            <div className="space-y-3">
              {(data.rows || []).slice(0, 6).map((row) => (
                <div className="flex justify-between text-xs" key={row.id}>
                  <span>
                    {row.description}
                    <small className="block text-slate-400">
                      {row.vendorName || row.category}
                    </small>
                  </span>
                  <b>{money(row.amount)}</b>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recurring Expenses">
            <div className="space-y-3">
              {(data.recurring || []).map((row) => (
                <div className="flex justify-between text-xs" key={row.id}>
                  <span>
                    {row.description}
                    <small className="block text-slate-400">
                      Next{" "}
                      {row.nextDate
                        ? new Date(row.nextDate).toLocaleDateString("en-IN")
                        : "—"}
                    </small>
                  </span>
                  <b>{money(row.amount)}</b>
                </div>
              ))}
            </div>
            <button
              className={`${button} mt-3 w-full justify-center`}
              onClick={() => setDrawer("recurring")}
            >
              <Plus size={13} /> Add Recurring
            </button>
          </Panel>
        </div>
      </div>
      {drawer === "expense" && (
        <ExpenseDrawer onClose={() => setDrawer("")} onComplete={reload} />
      )}
      {drawer === "recurring" && (
        <RecurringDrawer onClose={() => setDrawer("")} onComplete={reload} />
      )}
      {drawer === "upload" && <UploadDrawer onClose={() => setDrawer("")} />}
    </div>
  );
}

function Trend({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return (
    <div className="flex h-28 items-end gap-2">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1"
          key={row.month}
        >
          <div
            className="w-full rounded-t bg-blue-400"
            style={{ height: `${Math.max((row.amount / max) * 80, 4)}px` }}
          />
          <span className="text-[9px] text-slate-400">{row.month}</span>
        </div>
      ))}
    </div>
  );
}
function Donut({ rows = [] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-24 place-items-center rounded-full"
        style={{
          background:
            "conic-gradient(#2563eb 0 28%, #10b981 28% 46%, #f59e0b 46% 61%, #8b5cf6 61% 76%, #ec4899 76% 100%)",
        }}
      >
        <div className="grid size-14 place-items-center rounded-full bg-white text-center text-[10px] font-bold">
          {money(total)}
        </div>
      </div>
      <div className="space-y-1 text-[10px]">
        {rows.slice(0, 7).map((row) => (
          <div className="flex justify-between gap-4" key={row.category}>
            <span>{row.category}</span>
            <b>{money(row.amount)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function Bars({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((row) => (
        <div key={row.category}>
          <div className="mb-1 flex justify-between text-[10px]">
            <span>{row.category}</span>
            <b>{Math.round((row.amount / max) * 100)}%</b>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${Math.max((row.amount / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function ExpenseDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({ status: "paid" });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.createExpense(form);
      onComplete();
    } catch (error) {
      window.alert(error.message || "Expense could not be saved");
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Expense"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Save Expense"
    >
      <Field
        label="Date"
        type="date"
        value={form.date || ""}
        onChange={set("date")}
      />
      <Field
        label="Description"
        required
        value={form.description || ""}
        onChange={set("description")}
      />
      <Field label="Category">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.category || "Utilities"}
          onChange={set("category")}
        >
          <option>Utilities</option>
          <option>Food &amp; Beverages</option>
          <option>Maintenance</option>
          <option>Housekeeping</option>
          <option>Marketing</option>
          <option>Administration</option>
          <option>Others</option>
        </select>
      </Field>
      <Field
        label="Vendor"
        value={form.vendorName || ""}
        onChange={set("vendorName")}
      />
      <Field
        label="Amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={set("amount")}
      />
      <Field label="Payment method">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.paymentMethod || "bank_transfer"}
          onChange={set("paymentMethod")}
        >
          <option value="bank_transfer">Bank transfer</option>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </Field>
      <Field label="Status">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.status}
          onChange={set("status")}
        >
          <option value="paid">Paid</option>
          <option value="pending">Pending (also create payable)</option>
        </select>
      </Field>
    </ActionDrawer>
  );
}
function RecurringDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({ frequency: "monthly" });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.createRecurringExpense(form);
      onComplete();
    } catch (error) {
      window.alert(error.message || "Recurring expense could not be saved");
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Recurring Expense"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Save Recurring Expense"
    >
      <Field
        label="Description"
        required
        value={form.description || ""}
        onChange={set("description")}
      />
      <Field
        label="Category"
        value={form.category || ""}
        onChange={set("category")}
      />
      <Field
        label="Amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={set("amount")}
      />
      <Field
        label="Next date"
        type="date"
        required
        value={form.nextDate || ""}
        onChange={set("nextDate")}
      />
      <Field label="Frequency">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.frequency}
          onChange={set("frequency")}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </Field>
    </ActionDrawer>
  );
}
function UploadDrawer({ onClose }) {
  const [files, setFiles] = useState([]);
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.bulkUploadExpenses({
        files: files.map((file) => ({ fileName: file.name })),
      });
      onClose();
    } catch (error) {
      window.alert(error.message || "Bills could not be uploaded");
    }
  };
  return (
    <ActionDrawer
      title="Upload Bills"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Review Uploads"
    >
      <input
        className="w-full rounded-lg border border-dashed border-slate-300 p-8 text-xs"
        type="file"
        accept=".pdf,image/*"
        multiple
        onChange={(event) => setFiles([...event.target.files])}
      />
      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        Uploaded documents are staged as OCR drafts for review before expenses
        are created.
      </p>
    </ActionDrawer>
  );
}
