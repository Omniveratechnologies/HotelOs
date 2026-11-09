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
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
} from "@hotelos/ui/components";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, Panel, money } from "../billingUi.jsx";

export default function CorporateBillingPage() {
  const query = useQuery({
    queryKey: ["billing", "companies"],
    queryFn: () => billingApi.companiesSummary(),
  });
  const data = query.data || {};
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [drawer, setDrawer] = useState("");
  const [selected, setSelected] = useState(null);

  const industries = useMemo(() => {
    const set = new Set();
    (data.rows || []).forEach((r) => {
      if (r.industry) set.add(r.industry);
    });
    return Array.from(set);
  }, [data.rows]);

  const rows = useMemo(
    () =>
      (data.rows || []).filter((row) => {
        const text =
          `${row.name || ""} ${row.industry || ""} ${row.email || ""}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (industryFilter === "all" || row.industry === industryFilter) &&
          (tab === "all" ||
            (tab === "active" && row.status === "active") ||
            (tab === "outstanding" && row.outstanding > 0) ||
            (tab === "overdue" && row.status === "overdue") ||
            (tab === "inactive" && row.status === "inactive"))
        );
      }),
    [data.rows, search, tab, industryFilter],
  );

  const exportCsv = () => {
    if (!rows.length) return;
    const headers = [
      "Company",
      "Industry",
      "GSTIN",
      "Credit Limit",
      "Outstanding",
      "Status",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.name || ""}"`,
          `"${r.industry || ""}"`,
          `"${r.gstin || ""}"`,
          r.creditLimit || 0,
          r.outstanding || 0,
          `"${r.status || ""}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `corporate-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (query.isLoading)
    return (
      <div className="p-8 text-sm text-gray-500">
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
    <div>
      <Header
        pageTitle="Corporate Accounts & Direct Billing"
        pageDescription="Manage corporate accounts, contracts, credit limits and city-ledger collections."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
              onClick={() => setDrawer("company")}
            >
              <Plus size={14} /> Add Corporate Account
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={() => setDrawer("invoice")}
            >
              <FileText size={14} /> Generate Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={exportCsv}
            >
              <Download size={14} /> Export
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <KpiTileRow>
          <KpiTile
            title="Total Accounts"
            value={data.metrics?.totalAccounts || 0}
            subtitle={`${data.metrics?.newThisMonth || 0} new this month`}
            icon={Building2}
          />
          <KpiTile
            title="Total Billed This Month"
            value={money(data.metrics?.totalBilled)}
            subtitle="Current period"
            icon={FileText}
          />
          <KpiTile
            title="Outstanding Amount"
            value={money(data.metrics?.outstanding)}
            subtitle={`${data.metrics?.outstandingAccounts || 0} companies`}
            icon={Wallet}
          />
          <KpiTile
            title="Overdue Amount"
            value={money(data.metrics?.overdue)}
            subtitle="Needs follow-up"
            icon={CreditCard}
          />
          <KpiTile
            title="Active Contracts"
            value={data.metrics?.activeContracts || 0}
            subtitle="Expiring soon included"
            icon={CalendarDays}
          />
        </KpiTileRow>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["outstanding", "With Outstanding"],
            ["overdue", "Overdue"],
            ["inactive", "Inactive"],
          ].map(([value, label]) => (
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Panel title="Corporate Accounts">
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="focus-within:ring-primary-500 flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 focus-within:ring-1">
                <Search size={14} />
                <input
                  className="min-w-0 flex-1 text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Search company, GSTIN or contact..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select
                className="focus:ring-primary-500 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:ring-1 focus:outline-none"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="all">All Industries</option>
                {industries.map((ind) => (
                  <option value={ind} key={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-200 text-gray-700"
                onClick={exportCsv}
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  <tr>
                    {[
                      "Company",
                      "Industry / Contact",
                      "Credit Limit",
                      "Outstanding",
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
                    <tr
                      className="hover:bg-primary-50/20 cursor-pointer"
                      key={row.id}
                      onClick={() => setSelected(row)}
                    >
                      <td className="text-brand-900 px-4 py-3 font-semibold">
                        {row.name}
                        <div className="text-[11px] font-normal text-gray-400">
                          {row.gstin || "GSTIN not added"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.industry || "—"}
                        <div className="text-[11px] text-gray-400">
                          {row.email || row.phone || "No contact"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {money(row.creditLimit)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {money(row.outstanding)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusChip status={row.status || "active"} />
                          {row.creditLimit > 0 &&
                            row.outstanding >= row.creditLimit && (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                                Credit Locked
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
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
                <p className="p-8 text-center text-xs text-gray-400">
                  No corporate accounts match these filters.
                </p>
              )}
            </div>
          </Panel>

          <div className="space-y-6">
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
                    <div
                      className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                      key={row.id}
                    >
                      <span className="font-medium text-gray-800">
                        {row.name}
                      </span>
                      <b className="text-gray-900">{money(row.outstanding)}</b>
                    </div>
                  ))}
                {!data.rows?.length && (
                  <p className="py-2 text-xs text-gray-400">
                    No corporate accounts.
                  </p>
                )}
              </div>
            </Panel>
            <Panel title="Contract Expiry">
              <div className="space-y-2">
                {(data.contracts || []).map((row) => (
                  <div
                    className="flex justify-between border-b border-gray-50 py-1 text-xs last:border-0"
                    key={row.id}
                  >
                    <span className="text-gray-700">{row.name}</span>
                    <span className="font-medium text-amber-700">
                      {new Date(row.contractEnd).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
                {!data.contracts?.length && (
                  <p className="py-2 text-xs text-gray-400">
                    No contract data available.
                  </p>
                )}
              </div>
            </Panel>
          </div>
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
    <div className="flex h-36 items-end gap-3 pt-4">
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

function CompanyDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const save = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.createCompany(form);
      onComplete();
    } catch (err) {
      setError(err.message || "Company could not be saved");
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal text-gray-800 focus:ring-1 focus:outline-none"
          value={form.billingInstructions || "room_only"}
          onChange={set("billingInstructions")}
        >
          <option value="room_only">Room only</option>
          <option value="room_fnb">Room + F&amp;B</option>
        </select>
      </Field>
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function CompanyInvoiceDrawer({ company, onClose, onComplete }) {
  const [amount, setAmount] = useState("");
  const [managerOverride, setManagerOverride] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!company?.id) {
    return (
      <ActionDrawer
        title="Generate Invoice"
        onClose={onClose}
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
        submitLabel="Close"
      >
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Please select a company from the corporate accounts table first before
          generating an invoice.
        </p>
      </ActionDrawer>
    );
  }

  const isExceeded =
    company.creditLimit > 0 &&
    Number(company.outstanding || 0) + Number(amount || 0) >
      Number(company.creditLimit);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.createCompanyInvoice(company.id, {
        amount: Number(amount),
        managerOverride,
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Invoice could not be generated");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title={`Generate Invoice — ${company.name}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Generating..." : "Generate Corporate Invoice"}
    >
      <Field label="Company" value={company.name} readOnly />
      <div className="mb-3 flex justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs">
        <span className="text-gray-600">
          Credit Limit:{" "}
          <b className="text-gray-900">{money(company.creditLimit)}</b>
        </span>
        <span className="text-gray-600">
          Outstanding:{" "}
          <b className="text-gray-900">{money(company.outstanding)}</b>
        </span>
      </div>
      <Field
        label="Invoice amount (₹)"
        type="number"
        required
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      {isExceeded && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold text-rose-700">
            ⚠️ Warning: Adding this invoice exceeds the approved credit limit by{" "}
            {money(
              Number(company.outstanding || 0) +
                Number(amount || 0) -
                Number(company.creditLimit),
            )}
            .
          </p>
          <label className="mt-2 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={managerOverride}
              onChange={(e) => setManagerOverride(e.target.checked)}
            />
            <span className="font-bold text-gray-900">
              Apply Authorized Manager Override
            </span>
          </label>
        </div>
      )}
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function CompanyPaymentDrawer({ company, onClose, onComplete }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  if (!company?.id) {
    return (
      <ActionDrawer
        title="Record Payment"
        onClose={onClose}
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
        submitLabel="Close"
      >
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Please select a company from the corporate accounts table first before
          recording a payment.
        </p>
      </ActionDrawer>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.createCompanyPayment(company.id, form);
      onComplete();
    } catch (err) {
      setError(err.message || "Payment could not be recorded");
    }
  };
  return (
    <ActionDrawer
      title={`Record Payment — ${company.name}`}
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
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
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}
