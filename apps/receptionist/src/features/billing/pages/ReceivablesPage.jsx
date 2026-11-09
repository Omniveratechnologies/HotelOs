import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  AlertCircle,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Wallet,
} from "lucide-react";
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
} from "@hotelos/ui/components";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, Panel, money } from "../billingUi.jsx";

const typeLabels = {
  corporate: "Corporate",
  direct_guest: "Direct Guests",
  travel_agent: "Travel Agents",
  other: "Others",
};

export default function ReceivablesPage() {
  const query = useQuery({
    queryKey: ["billing", "receivables"],
    queryFn: () => billingApi.receivablesSummary(),
  });
  const data = query.data || {};
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState("");
  const [selected, setSelected] = useState([]);
  const rows = useMemo(
    () =>
      (data.rows || []).filter(
        (row) =>
          (!search ||
            `${row.accountName} ${row.reference} ${row.invoiceNo}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (tab === "all" || row.accountType === tab),
      ),
    [data.rows, search, tab],
  );
  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  if (query.isLoading)
    return (
      <div className="p-8 text-sm text-gray-500">Loading receivables…</div>
    );
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Receivables could not be loaded.
      </div>
    );

  return (
    <div>
      <Header
        pageTitle="Accounts Receivable & Aging"
        pageDescription="Control who owes the hotel, ageing, reminders and follow-up actions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
              onClick={() => setDrawer("invoice")}
            >
              <Plus size={14} /> Create Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("reminder")}
            >
              <Send size={14} /> Send Reminder
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => {
                if (!rows.length) return;
                const headers = [
                  "Account",
                  "Type",
                  "Invoice No",
                  "Due Date",
                  "Billed",
                  "Paid",
                  "Outstanding",
                  "Ageing Days",
                  "Status",
                ];
                const csv = [
                  headers.join(","),
                  ...rows.map((r) =>
                    [
                      `"${r.accountName || ""}"`,
                      `"${r.accountType || ""}"`,
                      `"${r.invoiceNo || r.reference || ""}"`,
                      `"${r.dueDate || ""}"`,
                      r.amount || r.grandTotal || 0,
                      r.paidAmount || r.paid || 0,
                      r.balance || 0,
                      r.ageingDays || 0,
                      `"${r.status || ""}"`,
                    ].join(","),
                  ),
                ].join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `receivables-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              }}
            >
              <Download size={14} /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <KpiTileRow>
          <KpiTile
            title="Total Outstanding"
            value={money(data.metrics?.outstanding)}
            subtitle="All open receivables"
            icon={Wallet}
          />
          <KpiTile
            title="0–30 Days"
            value={money(data.metrics?.["0-30"])}
            subtitle="Current"
          />
          <KpiTile
            title="31–60 Days"
            value={money(data.metrics?.["31-60"])}
            subtitle="Monitor"
          />
          <KpiTile
            title="61–90 Days"
            value={money(data.metrics?.["61-90"])}
            subtitle="Follow up"
          />
          <KpiTile
            title="90+ Days"
            value={money(data.metrics?.["90+"])}
            subtitle="Critical ageing"
            icon={AlertCircle}
          />
        </KpiTileRow>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          <Panel title="Aging Summary">
            <Aging rows={data.aging} />
          </Panel>
          <Panel title="Outstanding by Type">
            <div className="space-y-3">
              {(data.typeSplit || []).map((row) => (
                <div
                  className="flex items-center justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                  key={row.type}
                >
                  <span className="text-gray-700">
                    {typeLabels[row.type] || row.type}
                  </span>
                  <b className="text-gray-900">{money(row.amount)}</b>
                </div>
              ))}
              {!data.typeSplit?.length && (
                <p className="py-2 text-xs text-gray-400">
                  No type breakdown available.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel title="All Receivables">
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="focus-within:ring-primary-500 flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 focus-within:ring-1">
                <Search size={14} />
                <input
                  className="min-w-0 flex-1 text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Search account or invoice..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-200 text-gray-700"
                onClick={() => setDrawer("payment")}
              >
                <Wallet size={14} /> Record Payment
              </Button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {[["all", "All"], ...Object.entries(typeLabels)].map(
                ([value, label]) => (
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
                ),
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[780px] text-left text-xs">
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
                      "Account",
                      "Invoice / Due Date",
                      "Billed",
                      "Paid",
                      "Outstanding",
                      "Ageing",
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
                          onChange={() => toggle(row.id)}
                        />
                      </td>
                      <td className="text-brand-900 px-4 py-3 font-semibold">
                        {row.accountName || "Guest"}
                        <div className="text-[11px] font-normal text-gray-400">
                          {typeLabels[row.accountType] || row.accountType}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.invoiceNo || row.reference || "—"}
                        <div className="text-[11px] text-gray-400">
                          {row.dueDate
                            ? new Date(row.dueDate).toLocaleDateString("en-IN")
                            : "No due date"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {money(row.amount || row.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {money(row.paidAmount || row.paid)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {money(row.balance)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.ageingDays || 0} days
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                          onClick={() => {
                            setSelected([row.id]);
                            setDrawer("menu");
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
                  No open receivables match these filters.
                </p>
              )}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Follow Up Actions">
              <div className="space-y-3 text-xs">
                <Action
                  label="Payment reminders due"
                  value={data.metrics?.remindersDue}
                  onClick={() => setDrawer("reminder")}
                />
                <Action
                  label="Overdue accounts"
                  value={data.metrics?.overdue}
                />
                <Action
                  label="Upcoming due (next 7 days)"
                  value={data.metrics?.dueSoon}
                />
              </div>
              <Button
                variant="primary"
                className="bg-brand-900 hover:bg-brand-950 mt-4 w-full text-white"
                onClick={() => setDrawer("reminder")}
              >
                <Send size={13} className="mr-1.5 inline" /> Send Bulk Reminder
              </Button>
            </Panel>

            <Panel title="Top Outstanding Accounts">
              <div className="space-y-3">
                {(data.rows || []).slice(0, 5).map((row) => (
                  <div
                    className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                    key={row.id}
                  >
                    <span className="font-medium text-gray-800">
                      {row.accountName}
                    </span>
                    <b className="text-gray-900">{money(row.balance)}</b>
                  </div>
                ))}
                {!data.rows?.length && (
                  <p className="py-2 text-xs text-gray-400">
                    No outstanding accounts.
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="Latest Receipts">
              <p className="text-xs text-gray-500">
                Payments allocated to receivables will appear here.
              </p>
            </Panel>
          </div>
        </div>
      </div>

      {drawer === "invoice" && (
        <CreateReceivableInvoiceDrawer
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            query.refetch();
          }}
        />
      )}
      {drawer === "reminder" && (
        <ReminderDrawer
          ids={selected}
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            query.refetch();
          }}
        />
      )}
      {drawer === "payment" && (
        <PaymentDrawer
          selectedId={selected[0]}
          rows={rows}
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            query.refetch();
          }}
        />
      )}
      {drawer === "menu" && (
        <ActionDrawer
          title="Receivable actions"
          onClose={() => setDrawer("")}
          onSubmit={(event) => event.preventDefault()}
          submitLabel="Close"
        >
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start border-gray-200 text-xs"
              onClick={() => setDrawer("dispute")}
            >
              Mark disputed
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-gray-200 text-xs text-rose-700"
              onClick={() => setDrawer("writeoff")}
            >
              Request write-off
            </Button>
          </div>
        </ActionDrawer>
      )}
      {(drawer === "dispute" || drawer === "writeoff") && (
        <DecisionDrawer
          type={drawer}
          id={selected[0]}
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

function Aging({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return (
    <div className="flex h-36 items-end gap-4 pt-4">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1.5"
          key={row.bucket}
        >
          <span className="text-[10px] font-semibold text-gray-700">
            {money(row.amount)}
          </span>
          <div
            className="bg-primary-600 w-full rounded-t transition-all"
            style={{ height: `${Math.max((row.amount / max) * 100, 6)}px` }}
          />
          <span className="text-[10px] text-gray-500">{row.bucket}</span>
        </div>
      ))}
    </div>
  );
}

function Action({ label, value, onClick }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded px-1 py-1 text-left transition-colors hover:bg-gray-50"
      onClick={onClick}
    >
      <span className="text-gray-700">{label}</span>
      <b className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800">
        {value || 0}
      </b>
    </button>
  );
}

function CreateReceivableInvoiceDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({
    billTo: "",
    accountType: "corporate",
    amount: "",
    dueDate: "",
    description: "Accommodation & Services",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await billingApi.createInvoice({
        billTo: form.billTo,
        customerType: form.accountType,
        totalAmount: Number(form.amount) || 0,
        dueDate: form.dueDate,
        items: [
          {
            description: form.description,
            quantity: 1,
            rate: Number(form.amount) || 0,
            amount: Number(form.amount) || 0,
          },
        ],
      });
      onComplete();
    } catch (err) {
      setError(err?.message || "Failed to create receivable invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ActionDrawer
      title="Create Direct Invoice"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={submitting ? "Creating..." : "Create Invoice"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field
        label="Bill To / Account Name"
        required
        value={form.billTo}
        onChange={(e) => setForm({ ...form, billTo: e.target.value })}
      />
      <Field label="Account Type">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.accountType}
          onChange={(e) => setForm({ ...form, accountType: e.target.value })}
        >
          <option value="corporate">Corporate</option>
          <option value="direct_guest">Direct Guest</option>
          <option value="travel_agent">Travel Agent</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field
        label="Invoice Amount (₹)"
        type="number"
        required
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <Field
        label="Due Date"
        type="date"
        required
        value={form.dueDate}
        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
      />
      <Field
        label="Description / Remarks"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </ActionDrawer>
  );
}

function ReminderDrawer({ ids, onClose, onComplete }) {
  const [form, setForm] = useState({ template: "friendly", channel: "email" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.sendReceivableReminders({ ...form, receivableIds: ids });
      onComplete();
    } catch (err) {
      setError(err.message || "Reminder could not be queued");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Send Payment Reminder"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Queuing..." : "Queue Reminder"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-600">
        Target:{" "}
        <b className="text-gray-900">
          {ids.length
            ? `${ids.length} selected account(s)`
            : "All pending accounts"}
        </b>
      </div>
      <Field label="Template">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.template}
          onChange={(event) =>
            setForm({ ...form, template: event.target.value })
          }
        >
          <option value="friendly">Friendly reminder</option>
          <option value="firm">Firm notice</option>
          <option value="final">Final notice</option>
        </select>
      </Field>
      <Field label="Channel">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.channel}
          onChange={(event) =>
            setForm({ ...form, channel: event.target.value })
          }
        >
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>
      </Field>
      <p className="bg-primary-50 border-primary-100 text-primary-800 rounded-lg border p-3 text-xs">
        A statement of account will be attached and reminder history will be
        recorded.
      </p>
    </ActionDrawer>
  );
}

function PaymentDrawer({ selectedId, rows = [], onClose, onComplete }) {
  const selectedRow = rows.find((r) => r.id === selectedId);
  const [form, setForm] = useState({
    receivableId: selectedId || "",
    amount: selectedRow?.balance || selectedRow?.amount || "",
    method: "bank_transfer",
    reference: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.recordReceivablePayment(form);
      onComplete();
    } catch (err) {
      setError(err.message || "Payment could not be recorded");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Record Receivable Payment"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Recording..." : "Record & Allocate"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      {selectedRow && (
        <div className="bg-primary-50 border-primary-100 text-primary-900 mb-3 rounded-lg border p-2.5 text-xs">
          Recording for <b>{selectedRow.accountName}</b> (Balance:{" "}
          {money(selectedRow.balance)})
        </div>
      )}
      <Field
        label="Payment amount (₹)"
        type="number"
        required
        value={form.amount}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Method">
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
          value={form.method}
          onChange={(event) => setForm({ ...form, method: event.target.value })}
        >
          <option value="bank_transfer">Bank transfer</option>
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
    </ActionDrawer>
  );
}

function DecisionDrawer({ type, id, onClose, onComplete }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (type === "dispute")
        await billingApi.disputeReceivable(id, { reason });
      else await billingApi.writeOffReceivable(id, { reason, amount: 0 });
      onComplete();
    } catch (err) {
      setError(err.message || "Action could not be completed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title={
        type === "dispute" ? "Mark Receivable Disputed" : "Request Write-off"
      }
      onClose={onClose}
      onSubmit={submit}
      submitLabel={
        loading
          ? "Submitting..."
          : type === "dispute"
            ? "Mark Disputed"
            : "Submit for Approval"
      }
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field
        label="Reason"
        required
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        {type === "writeoff"
          ? "Write-offs remain pending until approved by an authorised manager."
          : "Reminders will pause while this item is disputed."}
      </p>
    </ActionDrawer>
  );
}
