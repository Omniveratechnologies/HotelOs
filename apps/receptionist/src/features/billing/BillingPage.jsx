import { useState } from "react";
import { useQuery } from "@hotelos/query";
import { AlertCircle, CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { billingApi } from "./billingApi.js";
import { billingScreens } from "./billingConfig.js";
import { FolioWorkspace, ScreenWorkspace } from "./BillingWorkspaces.jsx";
import {
  BillingPageHeader,
  ActionDrawer,
  BillingTable,
  BillingToolbar,
  DetailDrawer,
  Field,
  KpiCard,
  MiniBars,
  Panel,
  StatusPill,
  dateText,
  money,
  useFilteredRows,
} from "./billingUi.jsx";

function normalizeResponse(response) {
  if (Array.isArray(response)) return { rows: response, metrics: {} };
  return {
    rows: response?.rows || response?.items || response?.transactions || [],
    metrics: response?.metrics || response?.summary || {},
    chart: response?.chart || [],
    alerts: response?.alerts || [],
  };
}

function renderValue(row, field, type) {
  const value = row[field];
  if (type === "money") return money(value);
  if (type === "date") return dateText(value);
  if (type === "status") return <StatusPill value={value} />;
  return value || "—";
}

export default function BillingPage({ section }) {
  const screen = billingScreens[section] || billingScreens.folio;
  const [selected, setSelected] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const query = useQuery({
    queryKey: ["billing", section],
    queryFn: () => billingApi.dashboard(section),
  });
  const payload = normalizeResponse(query.data);
  const { search, setSearch, filtered } = useFilteredRows(payload.rows);

  const columns = screen.columns.map(([label, key, type]) => ({
    label,
    key,
    render: (row) => renderValue(row, key, type),
  }));

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 sm:p-6 lg:p-8">
      <BillingPageHeader
        title={screen.title}
        description={screen.description}
        actions={[
          {
            label: actionLabel(section),
            primary: true,
            icon: Plus,
            onClick: () => setActionOpen(true),
          },
          { label: "Export" },
        ]}
      />

      {query.isError && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {query.error?.message || "Billing data could not be loaded."}
          </span>
          <button
            className="inline-flex items-center gap-2 font-semibold"
            onClick={() => query.refetch()}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {screen.kpis.map(([label, key, tone, Icon]) => (
          <KpiCard
            key={key}
            label={label}
            value={query.isLoading ? "—" : moneyOrCount(payload.metrics[key])}
            detail={payload.metrics[`${key}Detail`] || "Live backend data"}
            tone={tone}
            icon={Icon}
          />
        ))}
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title={
            section === "night-audit" ? "Revenue Summary" : "Activity Trend"
          }
        >
          {payload.chart.length ? (
            <MiniBars
              values={payload.chart.map((item) =>
                Number(item.value || item.amount || 0),
              )}
            />
          ) : (
            <div className="flex h-28 items-center justify-center text-sm text-slate-400">
              Charts will populate from confirmed transactions.
            </div>
          )}
        </Panel>
        <Panel
          title={
            section === "night-audit"
              ? "Audit Checklist"
              : "Operational Summary"
          }
        >
          <div className="space-y-3">
            {(payload.alerts.length
              ? payload.alerts
              : ["No outstanding alerts returned by the backend."]
            ).map((alert) => (
              <div
                className="flex items-center gap-3 text-xs text-slate-600"
                key={
                  typeof alert === "string" ? alert : alert.id || alert.message
                }
              >
                <CheckCircle2 className="text-emerald-500" size={16} />
                {typeof alert === "string" ? alert : alert.message}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title={screen.title}>
          <BillingToolbar search={search} setSearch={setSearch} />
          {query.isLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Loading billing data…
            </div>
          ) : (
            <BillingTable
              rows={filtered}
              columns={columns}
              onRow={setSelected}
              empty="No billing records have been returned for this view."
            />
          )}
        </Panel>
        <DetailDrawer
          title="Details"
          row={selected}
          onClose={() => setSelected(null)}
          fields={screen.columns.map(([label, key, type]) => ({
            label,
            key,
            render: (row) => renderValue(row, key, type),
          }))}
        />
      </div>
      {section === "folio" && (
        <FolioWorkspace row={selected} onRefresh={() => query.refetch()} />
      )}
      {section !== "folio" && <ScreenWorkspace section={section} />}
      {actionOpen && (
        <ActionDrawer
          title={actionTitle(section)}
          onClose={() => {
            setActionOpen(false);
            setActionError("");
          }}
          onSubmit={async (event) => {
            event.preventDefault();
            setActionError("");
            const form = new FormData(event.currentTarget);
            try {
              await submitAction(section, Object.fromEntries(form.entries()));
              setActionOpen(false);
              await query.refetch();
            } catch (error) {
              setActionError(
                error.message || "The billing action could not be completed.",
              );
            }
          }}
          submitLabel={actionSubmitLabel(section)}
        >
          {actionFields(section)}
          {actionError && (
            <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
              {actionError}
            </p>
          )}
        </ActionDrawer>
      )}
    </div>
  );
}

function actionLabel(section) {
  if (section === "payments" || section === "cashier") return "Record Payment";
  if (section === "invoices" || section === "receivables")
    return "Create Invoice";
  if (section === "taxes-charges") return "Add Tax / Charge";
  if (section === "corporate") return "Add Corporate Account";
  if (section === "payables") return "Add Bill";
  if (section === "expenses") return "Add Expense";
  if (section === "reconciliation") return "Run Reconciliation";
  if (section === "night-audit") return "Start Night Audit";
  return "Add Charge";
}

function actionTitle(section) {
  return actionLabel(section);
}

function actionSubmitLabel(section) {
  return section === "reconciliation" || section === "night-audit"
    ? "Start"
    : "Save";
}

function actionFields(section) {
  if (section === "payments" || section === "cashier") {
    return (
      <>
        <Field label="Bill ID" name="billId" required />
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field label="Method">
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
            name="method"
            defaultValue="cash"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Bank Transfer</option>
          </select>
        </Field>
        <Field label="Reference" name="referenceNo" />
      </>
    );
  }
  if (section === "taxes-charges") {
    return (
      <>
        <Field label="Name" name="name" required />
        <Field
          label="Rate / Amount"
          name="value"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field
          label="Applicable department"
          name="applicableOn"
          placeholder="room, fnb, service or other"
          required
        />
      </>
    );
  }
  if (section === "payables" || section === "expenses") {
    return (
      <>
        <Field label="Description" name="description" required />
        <Field label="Vendor" name="vendorName" required />
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field
          label="Tax"
          name="tax"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
        />
        <Field label="Category" name="category" required />
        <Field label="Due date" name="dueDate" type="date" />
        <Field
          label="Cost centre"
          name="costCentre"
          placeholder="Rooms, F&B, Admin"
        />
      </>
    );
  }
  if (section === "corporate") {
    return (
      <>
        <Field label="Legal company name" name="companyName" required />
        <Field label="GSTIN" name="gstin" />
        <Field label="Industry" name="industry" />
        <Field label="Contact person" name="contactName" required />
        <Field label="Email" name="email" type="email" />
        <Field
          label="Credit limit"
          name="creditLimit"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field
          label="Credit days"
          name="creditDays"
          type="number"
          min="0"
          defaultValue="30"
        />
        <Field
          label="Billing instruction"
          name="billingInstruction"
          placeholder="Room only / Room + F&B"
        />
      </>
    );
  }
  if (section === "invoices") {
    return (
      <>
        <Field label="Folio ID" name="folioId" required />
        <Field
          label="Invoice type"
          name="invoiceType"
          defaultValue="tax"
          required
        />
        <Field label="Bill-to name" name="billTo" required />
        <Field label="GSTIN" name="gstin" />
        <Field label="Place of supply" name="placeOfSupply" />
      </>
    );
  }
  if (section === "reconciliation")
    return (
      <Field label="Business date" name="businessDate" type="date" required />
    );
  if (section === "night-audit")
    return (
      <Field label="Business date" name="businessDate" type="date" required />
    );
  return (
    <>
      <Field label="Bill / Folio ID" name="billId" required />
      <Field label="Description" name="description" required />
      <Field
        label="Amount"
        name="amount"
        type="number"
        min="0"
        step="0.01"
        required
      />
      <Field label="Department" name="department" required />
    </>
  );
}

function submitAction(section, body) {
  if (section === "payments" || section === "cashier")
    return billingApi.createPayment(body);
  if (section === "taxes-charges") return billingApi.createTaxRule(body);
  if (section === "reconciliation") return billingApi.runReconciliation(body);
  if (section === "night-audit") return billingApi.startNightAudit(body);
  if (section === "folio") return billingApi.createCharge(body);
  if (section === "invoices")
    return billingApi.createResource("invoice", {
      ...body,
      status: "pending",
      reference: body.folioId,
      data: body,
    });
  if (section === "corporate")
    return billingApi.createResource("company", {
      ...body,
      status: "active",
      data: body,
    });
  if (section === "payables")
    return billingApi.createResource("payable", {
      ...body,
      status: "pending",
      data: body,
    });
  if (section === "expenses")
    return billingApi.createResource("expense", {
      ...body,
      status: body.status || "pending",
      data: body,
    });
  if (section === "receivables")
    return billingApi.createResource("receivable", {
      ...body,
      status: "pending",
      data: body,
    });
  return billingApi.createBill(body);
}

function moneyOrCount(value) {
  if (value === undefined || value === null) return "—";
  return typeof value === "number" && value > 999
    ? money(value)
    : String(value);
}
