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
    return <div className="p-8 text-sm text-gray-500">Loading expenses…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Expenses could not be loaded.
      </div>
    );

  return (
    <div>
      <Header
        pageTitle="Operational Expenses & Outflow"
        pageDescription="Track and manage hotel expenses, vendor payments and operational costs."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
              onClick={() => setDrawer("expense")}
            >
              <Plus size={14} /> Add Expense
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("upload")}
            >
              <Upload size={14} /> Upload Bills
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => downloadCsv(data.rows || [], "expenses.csv")}
            >
              <Download size={14} /> Export
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <KpiTileRow>
          <KpiTile
            title="Total Expenses This Month"
            value={money(data.metrics?.total)}
            subtitle="vs last month"
            icon={Receipt}
          />
          <KpiTile
            title="Paid Expenses"
            value={money(data.metrics?.paid)}
            subtitle="Recorded payments"
            icon={Wallet}
          />
          <KpiTile
            title="Pending Payments"
            value={money(data.metrics?.pending)}
            subtitle="Also in Payables"
          />
          <KpiTile
            title="Total Vendors"
            value={data.metrics?.vendors || 0}
            subtitle="Active vendors"
          />
          <KpiTile
            title="Average Monthly Expense"
            value={money(data.metrics?.average)}
            subtitle="Last 6 months"
          />
        </KpiTileRow>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_300px]">
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel title="All Expenses">
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="focus-within:ring-primary-500 flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 focus-within:ring-1">
                <Search size={14} />
                <input
                  className="min-w-0 flex-1 text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Search by description, vendor..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-200 text-gray-700"
                onClick={() => downloadCsv(rows, "expenses-filtered.csv")}
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
                  {label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
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
                      <th className="px-4 py-3" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr className="hover:bg-primary-50/20" key={row.id}>
                      <td className="px-4 py-3 text-gray-600">
                        {date(row.date)}
                      </td>
                      <td className="text-brand-900 px-4 py-3 font-semibold">
                        {row.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-primary-50 text-primary-700 rounded-full px-2.5 py-1 text-[11px] font-medium">
                          {row.category || "Others"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.vendorName || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize">
                        {row.paymentMethod
                          ? row.paymentMethod.replace("_", " ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {money(row.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={row.status || row.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <button className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && (
                <p className="p-8 text-center text-xs text-gray-400">
                  No expenses match these filters.
                </p>
              )}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Recent Expenses">
              <div className="space-y-3">
                {(data.rows || []).slice(0, 6).map((row) => (
                  <div
                    className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                    key={row.id}
                  >
                    <span>
                      <span className="font-medium text-gray-800">
                        {row.description}
                      </span>
                      <small className="block text-gray-400">
                        {row.vendorName || row.category}
                      </small>
                    </span>
                    <b className="text-gray-900">{money(row.amount)}</b>
                  </div>
                ))}
                {!data.rows?.length && (
                  <p className="py-2 text-xs text-gray-400">
                    No recent expenses.
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="Recurring Expenses">
              <div className="space-y-3">
                {(data.recurring || []).map((row) => (
                  <div
                    className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                    key={row.id}
                  >
                    <span>
                      <span className="font-medium text-gray-800">
                        {row.description}
                      </span>
                      <small className="block text-gray-400">
                        Next {date(row.nextDate)}
                      </small>
                    </span>
                    <b className="text-gray-900">{money(row.amount)}</b>
                  </div>
                ))}
                {!data.recurring?.length && (
                  <p className="py-2 text-xs text-gray-400">
                    No recurring expenses scheduled.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full justify-center gap-1.5 border-gray-200 text-gray-700"
                onClick={() => setDrawer("recurring")}
              >
                <Plus size={13} /> Add Recurring
              </Button>
            </Panel>
          </div>
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
    <div className="flex h-32 items-end gap-2 pt-4">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1.5"
          key={row.month}
        >
          <div
            className="bg-primary-600 w-full rounded-t transition-all"
            style={{ height: `${Math.max((row.amount / max) * 85, 6)}px` }}
          />
          <span className="w-full truncate text-center text-[10px] text-gray-500">
            {row.month}
          </span>
        </div>
      ))}
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
        {rows.slice(0, 7).map((row, idx) => (
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

function Bars({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((row) => (
        <div key={row.category}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-700">{row.category}</span>
            <b className="text-gray-900">
              {Math.round((row.amount / max) * 100)}%
            </b>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${Math.max((row.amount / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
      {!rows.length && (
        <p className="py-2 text-xs text-gray-400">No category data.</p>
      )}
    </div>
  );
}

function ExpenseDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({
    status: "paid",
    category: "Utilities",
    paymentMethod: "bank_transfer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.createExpense({
        ...form,
        amount: Number(form.amount) || 0,
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Expense could not be saved");
    } finally {
      setLoading(false);
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Expense"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Saving..." : "Save Expense"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.category}
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
        label="Amount (₹)"
        type="number"
        required
        value={form.amount || ""}
        onChange={set("amount")}
      />
      <Field label="Payment method">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.paymentMethod}
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.createRecurringExpense({
        ...form,
        amount: Number(form.amount) || 0,
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Recurring expense could not be saved");
    } finally {
      setLoading(false);
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Recurring Expense"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Saving..." : "Save Recurring Expense"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
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
        label="Amount (₹)"
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.bulkUploadExpenses({
        files: files.map((file) => ({ fileName: file.name })),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Bills could not be uploaded");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Upload Bills"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Uploading..." : "Review Uploads"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <input
        className="focus:ring-primary-500 w-full rounded-lg border border-dashed border-gray-300 p-8 text-xs text-gray-600 focus:ring-1 focus:outline-none"
        type="file"
        accept=".pdf,image/*"
        multiple
        onChange={(event) => setFiles([...event.target.files])}
      />
      <p className="bg-primary-50 border-primary-100 text-primary-800 mt-3 rounded-lg border p-3 text-xs">
        Uploaded documents are staged as OCR drafts for review before expenses
        are created.
      </p>
    </ActionDrawer>
  );
}
