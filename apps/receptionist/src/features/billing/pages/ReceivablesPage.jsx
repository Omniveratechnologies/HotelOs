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
      <div className="p-8 text-sm text-slate-500">Loading receivables…</div>
    );
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Receivables could not be loaded.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Receivables
          </div>
          <h1 className="text-2xl font-bold">Receivables</h1>
          <p className="text-xs text-slate-500">
            Control who owes the hotel, ageing, reminders and follow-up actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white">
            <Plus size={14} /> Create Invoice
          </button>
          <button className={button} onClick={() => setDrawer("reminder")}>
            <Send size={14} /> Send Reminder
          </button>
          <button className={button}>
            <Download size={14} /> Export
          </button>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Outstanding"
          value={money(data.metrics?.outstanding)}
          detail="All open receivables"
          icon={Wallet}
        />
        <KpiCard
          label="0–30 Days"
          value={money(data.metrics?.["0-30"])}
          detail="Current"
          tone="green"
        />
        <KpiCard
          label="31–60 Days"
          value={money(data.metrics?.["31-60"])}
          detail="Monitor"
          tone="amber"
        />
        <KpiCard
          label="61–90 Days"
          value={money(data.metrics?.["61-90"])}
          detail="Follow up"
          tone="amber"
        />
        <KpiCard
          label="90+ Days"
          value={money(data.metrics?.["90+"])}
          detail="Critical ageing"
          tone="red"
          icon={AlertCircle}
        />
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_350px]">
        <Panel title="Aging Summary">
          <Aging rows={data.aging} />
        </Panel>
        <Panel title="Outstanding by Type">
          <div className="space-y-3">
            {(data.typeSplit || []).map((row) => (
              <div
                className="flex items-center justify-between text-xs"
                key={row.type}
              >
                <span>{typeLabels[row.type] || row.type}</span>
                <b>{money(row.amount)}</b>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="All Receivables">
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search size={14} />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search account or invoice..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className={button} onClick={() => setDrawer("payment")}>
              <Wallet size={14} /> Record Payment
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {[["all", "All"], ...Object.entries(typeLabels)].map(
              ([value, label]) => (
                <button
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === value ? "bg-[#102b5c] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  key={value}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              ),
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[11px]">
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
                    "Account",
                    "Invoice / Due Date",
                    "Billed",
                    "Paid",
                    "Outstanding",
                    "Ageing",
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
                        onChange={() => toggle(row.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {row.accountName || "Guest"}
                      <div className="text-[10px] font-normal text-slate-400">
                        {typeLabels[row.accountType] || row.accountType}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.invoiceNo || row.reference || "—"}
                      <div className="text-[10px] text-slate-400">
                        {row.dueDate
                          ? new Date(row.dueDate).toLocaleDateString("en-IN")
                          : "No due date"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {money(row.amount || row.grandTotal)}
                    </td>
                    <td className="px-3 py-3">
                      {money(row.paidAmount || row.paid)}
                    </td>
                    <td className="px-3 py-3 font-bold">
                      {money(row.balance)}
                    </td>
                    <td className="px-3 py-3">{row.ageingDays || 0} days</td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.status} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-slate-200 p-1"
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
              <p className="p-8 text-center text-xs text-slate-400">
                No open receivables match these filters.
              </p>
            )}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Follow Up Actions">
            <div className="space-y-3 text-xs">
              <Action
                label="Payment reminders due"
                value={data.metrics?.remindersDue}
                onClick={() => setDrawer("reminder")}
              />
              <Action label="Overdue accounts" value={data.metrics?.overdue} />
              <Action
                label="Upcoming due (next 7 days)"
                value={data.metrics?.dueSoon}
              />
            </div>
            <button
              className="mt-4 w-full rounded-lg bg-[#102b5c] px-3 py-2 text-xs font-bold text-white"
              onClick={() => setDrawer("reminder")}
            >
              <Send size={13} className="mr-1 inline" /> Send Bulk Reminder
            </button>
          </Panel>
          <Panel title="Top Outstanding Accounts">
            <div className="space-y-3">
              {(data.rows || []).slice(0, 5).map((row) => (
                <div className="flex justify-between text-xs" key={row.id}>
                  <span>{row.accountName}</span>
                  <b>{money(row.balance)}</b>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Latest Receipts">
            <p className="text-xs text-slate-500">
              Payments allocated to receivables will appear here.
            </p>
          </Panel>
        </div>
      </div>
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
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            onClick={() => setDrawer("dispute")}
          >
            Mark disputed
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            onClick={() => setDrawer("writeoff")}
          >
            Request write-off
          </button>
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
    <div className="flex h-36 items-end gap-4">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1"
          key={row.bucket}
        >
          <span className="text-[10px] font-semibold">{money(row.amount)}</span>
          <div
            className="w-full rounded-t bg-blue-500"
            style={{ height: `${Math.max((row.amount / max) * 100, 5)}px` }}
          />
          <span className="text-[10px] text-slate-500">{row.bucket}</span>
        </div>
      ))}
    </div>
  );
}
function Action({ label, value, onClick }) {
  return (
    <button
      className="flex w-full items-center justify-between text-left"
      onClick={onClick}
    >
      <span>{label}</span>
      <b className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
        {value || 0}
      </b>
    </button>
  );
}
function ReminderDrawer({ ids, onClose, onComplete }) {
  const [form, setForm] = useState({ template: "friendly", channel: "email" });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.sendReceivableReminders({ ...form, receivableIds: ids });
      onComplete();
    } catch (error) {
      window.alert(error.message || "Reminder could not be queued");
    }
  };
  return (
    <ActionDrawer
      title="Send Payment Reminder"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Queue Reminder"
    >
      <Field label="Template">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
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
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
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
      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        A statement of account will be attached and reminder history will be
        recorded.
      </p>
    </ActionDrawer>
  );
}
function PaymentDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({});
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.recordReceivablePayment(form);
      onComplete();
    } catch (error) {
      window.alert(error.message || "Payment could not be recorded");
    }
  };
  return (
    <ActionDrawer
      title="Record Receivable Payment"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Record & Allocate"
    >
      <Field
        label="Payment amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Method">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.method || "bank_transfer"}
          onChange={(event) => setForm({ ...form, method: event.target.value })}
        >
          <option value="bank_transfer">Bank transfer</option>
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
    </ActionDrawer>
  );
}
function DecisionDrawer({ type, id, onClose, onComplete }) {
  const [reason, setReason] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      if (type === "dispute")
        await billingApi.disputeReceivable(id, { reason });
      else await billingApi.writeOffReceivable(id, { reason, amount: 0 });
      onComplete();
    } catch (error) {
      window.alert(error.message || "Action could not be completed");
    }
  };
  return (
    <ActionDrawer
      title={
        type === "dispute" ? "Mark Receivable Disputed" : "Request Write-off"
      }
      onClose={onClose}
      onSubmit={submit}
      submitLabel={type === "dispute" ? "Mark Disputed" : "Submit for Approval"}
    >
      <Field
        label="Reason"
        required
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        {type === "writeoff"
          ? "Write-offs remain pending until approved by an authorised manager."
          : "Reminders will pause while this item is disputed."}
      </p>
    </ActionDrawer>
  );
}
