import { useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { billingApi } from "./billingApi.js";
import { billingScreens } from "./billingConfig.js";
import { FolioWorkspace, ScreenWorkspace } from "./BillingWorkspaces.jsx";
import {
  Header,
  Button,
  DataTable,
  KpiTile,
  KpiTileRow,
  StatusChip,
  DetailDrawer,
  ActionDrawer,
  Field,
  MiniBars,
  Panel,
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
  if (type === "status")
    return (
      <StatusChip variant={value}>
        {String(value || "Pending").replaceAll("_", " ")}
      </StatusChip>
    );
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

  const toneClassMap = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <>
      <Header pageTitle={screen.title} pageDescription={screen.description}>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setActionOpen(true)}
        >
          {actionLabel(section)}
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        {query.isError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} />
              {query.error?.message || "Billing data could not be loaded."}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => query.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        <KpiTileRow>
          {screen.kpis.map(([label, key, tone, Icon]) => (
            <KpiTile
              key={key}
              label={label}
              value={query.isLoading ? "—" : moneyOrCount(payload.metrics[key])}
              delta={payload.metrics[`${key}Detail`] || "Live backend data"}
              icon={Icon}
              iconClassName={toneClassMap[tone] || "bg-brand-50 text-brand-700"}
            />
          ))}
        </KpiTileRow>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
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
              <div className="flex h-28 items-center justify-center text-sm text-gray-400">
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
                  className="flex items-center gap-3 text-xs text-gray-600"
                  key={
                    typeof alert === "string"
                      ? alert
                      : alert.id || alert.message
                  }
                >
                  <CheckCircle2
                    className="shrink-0 text-emerald-500"
                    size={16}
                  />
                  <span>
                    {typeof alert === "string" ? alert : alert.message}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-2xs">
          <Search size={16} className="text-gray-400" />
          <input
            className="text-brand-900 w-full outline-none placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records, guests, vouchers..."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <DataTable
            title={screen.title}
            description={`Showing ${filtered.length} of ${payload.rows.length} items`}
            columns={columns}
            rows={filtered}
            loading={query.isLoading}
            onRowClick={setSelected}
            emptyTitle="No billing records"
            emptyDescription="No records returned for this billing view."
          />
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
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {actionError}
              </p>
            )}
          </ActionDrawer>
        )}
      </div>
    </>
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
        <Field label="Payment method" name="method" defaultValue="cash" />
        <Field label="Reference / Transaction note" name="reference" />
      </>
    );
  }
  if (section === "taxes-charges") {
    return (
      <>
        <Field label="Tax / Surcharge Name" name="name" required />
        <Field label="Type" name="type" defaultValue="tax" required />
        <Field
          label="Rate (%)"
          name="rate"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field
          label="Applies to"
          name="appliesTo"
          defaultValue="room"
          required
        />
      </>
    );
  }
  if (section === "corporate") {
    return (
      <>
        <Field label="Company name" name="name" required />
        <Field
          label="Credit limit"
          name="creditLimit"
          type="number"
          min="0"
          required
        />
        <Field label="Billing contact" name="contactPerson" required />
        <Field label="Contact email" name="email" type="email" required />
        <Field label="Payment terms (days)" name="terms" defaultValue="30" />
      </>
    );
  }
  if (section === "payables") {
    return (
      <>
        <Field label="Vendor name" name="vendorName" required />
        <Field label="Invoice reference" name="invoiceNo" required />
        <Field
          label="Total amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field label="Due date" name="dueDate" type="date" required />
        <Field label="Expense category" name="category" required />
      </>
    );
  }
  if (section === "expenses") {
    return (
      <>
        <Field label="Expense title" name="title" required />
        <Field label="Department" name="department" required />
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field
          label="Payment method"
          name="paymentMethod"
          defaultValue="cash"
        />
        <Field label="Recorded date" name="date" type="date" required />
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
  if (section === "invoices") return billingApi.createInvoice(body);
  if (section === "corporate") return billingApi.createCompany(body);
  if (section === "payables") return billingApi.createPayable(body);
  if (section === "expenses") return billingApi.createExpense(body);
  if (section === "receivables")
    return billingApi.recordReceivablePayment(body);
  return billingApi.createBill(body);
}

function moneyOrCount(value) {
  if (value === undefined || value === null) return "—";
  return typeof value === "number" && value > 999
    ? money(value)
    : String(value);
}
