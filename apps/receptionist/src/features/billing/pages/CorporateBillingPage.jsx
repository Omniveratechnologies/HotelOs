import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
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
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm hover:border-blue-300";

export default function CorporateBillingPage() {
  const query = useQuery({
    queryKey: ["billing", "companies"],
    queryFn: () => billingApi.companiesSummary(),
  });
  const data = query.data || {};
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState("");
  const [selected, setSelected] = useState(null);
  const rows = useMemo(
    () =>
      (data.rows || []).filter((row) => {
        const text = `${row.name} ${row.industry} ${row.email}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (tab === "all" ||
            (tab === "active" && row.status === "active") ||
            (tab === "outstanding" && row.outstanding > 0) ||
            (tab === "overdue" && row.status === "overdue") ||
            (tab === "inactive" && row.status === "inactive"))
        );
      }),
    [data.rows, search, tab],
  );
  if (query.isLoading)
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading corporate billing…
      </div>
    );
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Corporate billing could not be loaded.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Corporate Billing
          </div>
          <h1 className="text-2xl font-bold">Corporate Billing</h1>
          <p className="text-xs text-slate-500">
            Manage corporate accounts, contracts, credit limits and city-ledger
            collections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => setDrawer("company")}
          >
            <Plus size={14} /> Add Corporate Account
          </button>
          <button className={button} onClick={() => setDrawer("invoice")}>
            <FileText size={14} /> Generate Invoice
          </button>
          <button className={button}>
            <Download size={14} /> Export
          </button>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Accounts"
          value={data.metrics?.totalAccounts || 0}
          detail={`${data.metrics?.newThisMonth || 0} new this month`}
          icon={Building2}
        />
        <KpiCard
          label="Total Billed This Month"
          value={money(data.metrics?.totalBilled)}
          detail="Current period"
          tone="green"
          icon={FileText}
        />
        <KpiCard
          label="Outstanding Amount"
          value={money(data.metrics?.outstanding)}
          detail={`${data.metrics?.outstandingAccounts || 0} companies`}
          tone="amber"
          icon={Wallet}
        />
        <KpiCard
          label="Overdue Amount"
          value={money(data.metrics?.overdue)}
          detail="Needs follow-up"
          tone="red"
          icon={CreditCard}
        />
        <KpiCard
          label="Active Contracts"
          value={data.metrics?.activeContracts || 0}
          detail="Expiring soon included"
          tone="purple"
          icon={CalendarDays}
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["active", "Active"],
          ["outstanding", "With Outstanding"],
          ["overdue", "Overdue"],
          ["inactive", "Inactive"],
        ].map(([value, label]) => (
          <button
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === value ? "bg-[#102b5c] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
            key={value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Panel title="Corporate Accounts">
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search size={14} />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search company, GSTIN or contact..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select className="rounded-lg border border-slate-200 px-3 text-xs">
              <option>All Industries</option>
            </select>
            <button className={button}>
              <Download size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[11px]">
              <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  {[
                    "Company",
                    "Industry / Contact",
                    "Credit Limit",
                    "Outstanding",
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
                    className="cursor-pointer border-b border-slate-50 hover:bg-blue-50/40"
                    key={row.id}
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-3 py-3 font-semibold">
                      {row.name}
                      <div className="text-[10px] font-normal text-slate-400">
                        {row.gstin || "GSTIN not added"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.industry || "—"}
                      <div className="text-[10px] text-slate-400">
                        {row.email || row.phone || "No contact"}
                      </div>
                    </td>
                    <td className="px-3 py-3">{money(row.creditLimit)}</td>
                    <td className="px-3 py-3 font-bold">
                      {money(row.outstanding)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.status || "active"} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-slate-200 p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDrawer("payment");
                          setSelected(row);
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
                No corporate accounts match these filters.
              </p>
            )}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Outstanding by Age">
            <AgeChart rows={data.aging} />
          </Panel>
          <Panel title="Top 5 Outstanding Companies">
            <div className="space-y-3">
              {(data.rows || [])
                .slice()
                .sort((a, b) => b.outstanding - a.outstanding)
                .slice(0, 5)
                .map((row) => (
                  <div className="flex justify-between text-xs" key={row.id}>
                    <span className="font-semibold">{row.name}</span>
                    <b>{money(row.outstanding)}</b>
                  </div>
                ))}
            </div>
          </Panel>
          <Panel title="Contract Expiry">
            <div className="space-y-2">
              {(data.contracts || []).map((row) => (
                <div className="flex justify-between text-xs" key={row.id}>
                  <span>{row.name}</span>
                  <span className="text-amber-600">
                    {new Date(row.contractEnd).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      {drawer === "company" && (
        <CompanyDrawer
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            query.refetch();
          }}
        />
      )}
      {drawer === "invoice" && (
        <CompanyInvoiceDrawer
          company={selected}
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            query.refetch();
          }}
        />
      )}
      {drawer === "payment" && (
        <CompanyPaymentDrawer
          company={selected}
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

function AgeChart({ rows = [] }) {
  const max = Math.max(...rows.map((row) => Number(row.amount || 0)), 1);
  return (
    <div className="flex h-36 items-end gap-3">
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
function CompanyDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({});
  const save = async (event) => {
    event.preventDefault();
    try {
      await billingApi.createCompany(form);
      onComplete();
    } catch (error) {
      window.alert(error.message || "Company could not be saved");
    }
  };
  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <ActionDrawer
      title="Add Corporate Account"
      onClose={onClose}
      onSubmit={save}
      submitLabel="Save Corporate Account"
    >
      <Field
        label="Legal company name"
        required
        value={form.name || ""}
        onChange={set("name")}
      />
      <Field label="GSTIN" value={form.gstin || ""} onChange={set("gstin")} />
      <Field label="PAN" value={form.pan || ""} onChange={set("pan")} />
      <Field
        label="Industry"
        value={form.industry || ""}
        onChange={set("industry")}
      />
      <Field
        label="Billing email"
        type="email"
        value={form.email || ""}
        onChange={set("email")}
      />
      <Field
        label="Credit limit"
        type="number"
        value={form.creditLimit || ""}
        onChange={set("creditLimit")}
      />
      <Field
        label="Credit days"
        type="number"
        value={form.creditDays || 30}
        onChange={set("creditDays")}
      />
      <Field
        label="Contract end"
        type="date"
        value={form.contractEnd || ""}
        onChange={set("contractEnd")}
      />
      <Field label="Billing instructions">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
          value={form.billingInstructions || "room_only"}
          onChange={set("billingInstructions")}
        >
          <option value="room_only">Room only</option>
          <option value="room_fnb">Room + F&amp;B</option>
        </select>
      </Field>
    </ActionDrawer>
  );
}
function CompanyInvoiceDrawer({ company, onClose, onComplete }) {
  const [amount, setAmount] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.createCompanyInvoice(company?.id, {
        amount: Number(amount),
      });
      onComplete();
    } catch (error) {
      window.alert(error.message || "Invoice could not be generated");
    }
  };
  return (
    <ActionDrawer
      title={`Generate Invoice${company ? ` — ${company.name}` : ""}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Generate Corporate Invoice"
    >
      <Field
        label="Company"
        value={company?.name || "Select a company from the table"}
        readOnly
      />
      <Field
        label="Invoice amount"
        type="number"
        required
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
    </ActionDrawer>
  );
}
function CompanyPaymentDrawer({ company, onClose, onComplete }) {
  const [form, setForm] = useState({});
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.createCompanyPayment(company.id, form);
      onComplete();
    } catch (error) {
      window.alert(error.message || "Payment could not be recorded");
    }
  };
  return (
    <ActionDrawer
      title={`Record Payment — ${company?.name}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Record & Allocate Payment"
    >
      <Field
        label="Amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Method">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.mode || "bank_transfer"}
          onChange={(event) => setForm({ ...form, mode: event.target.value })}
        >
          <option value="bank_transfer">Bank transfer / NEFT</option>
          <option value="cheque">Cheque</option>
        </select>
      </Field>
      <Field
        label="Reference / UTR"
        required
        value={form.reference || ""}
        onChange={(event) =>
          setForm({ ...form, reference: event.target.value })
        }
      />
    </ActionDrawer>
  );
}
