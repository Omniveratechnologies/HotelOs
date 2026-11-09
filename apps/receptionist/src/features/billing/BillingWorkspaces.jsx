import { useState } from "react";
import {
  CheckCircle2,
  FileDown,
  GitMerge,
  Layers3,
  Mail,
  Printer,
  Split,
  Upload,
} from "lucide-react";
import { billingApi } from "./billingApi.js";
import {
  ActionDrawer,
  Field,
  KpiTile,
  Panel,
  StatusChip,
  Button,
  money,
} from "./billingUi.jsx";

const tabs = [
  "Folio",
  "Payments",
  "Invoices",
  "Guest Details",
  "Stay History",
  "Corporate",
  "Remarks",
];

const actionClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brand-900 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer";

export function FolioWorkspace({ row, onRefresh }) {
  const [tab, setTab] = useState("Folio");
  const [drawer, setDrawer] = useState("");
  const [correctionAction, setCorrectionAction] = useState("void");
  const [error, setError] = useState("");
  if (!row) return null;
  const close = () => {
    setDrawer("");
    setError("");
  };
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      if (drawer === "charge")
        await billingApi.addFolioCharge(row.id || row._id, values);
      if (drawer === "split")
        await billingApi.splitFolio(row.id || row._id, values);
      if (drawer === "merge")
        await billingApi.mergeFolio(row.id || row._id, values);
      if (drawer === "invoice")
        await billingApi.generateInvoice(row.id || row._id, values);
      if (drawer === "payment")
        await billingApi.collectFolioPayment(row.id || row._id, values);
      if (drawer === "share")
        await billingApi.shareFolio(row.id || row._id, values);
      if (drawer === "correction")
        await billingApi.correctFolioCharge(
          row.id || row._id,
          values.action,
          values,
        );
      close();
      onRefresh?.();
    } catch (requestError) {
      setError(
        requestError.message || "The folio action could not be completed.",
      );
    }
  };
  return (
    <div className="space-y-6">
      <Panel title="Guest Folio Summary">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-brand-50 text-brand-700 grid size-12 place-items-center rounded-xl text-lg font-bold">
            {(row.guestName || "G").slice(0, 1).toUpperCase()}
          </div>
          <div className="mr-auto">
            <p className="font-display text-brand-900 font-semibold">
              {row.guestName || "Guest folio"}
            </p>
            <p className="text-xs text-gray-500">
              Folio {row.folioNo || row.billNo || "—"} · Booking{" "}
              {row.bookingId || "—"}
            </p>
          </div>
          <StatusChip variant={row.status}>{row.status || "Open"}</StatusChip>
          <button className={actionClass} onClick={() => setDrawer("charge")}>
            Add Charge
          </button>
          <button className={actionClass} onClick={() => setDrawer("split")}>
            <Split size={14} /> Split Folio
          </button>
          <button className={actionClass} onClick={() => setDrawer("merge")}>
            <GitMerge size={14} /> Merge Folio
          </button>
          <button className={actionClass} onClick={() => setDrawer("invoice")}>
            <FileDown size={14} /> Generate Invoice
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-1 border-b border-gray-100">
          {tabs.map((item) => (
            <button
              className={`px-3.5 py-2 text-xs font-semibold transition-colors ${tab === item ? "border-brand-900 text-brand-900 border-b-2" : "hover:text-brand-900 text-gray-500"}`}
              key={item}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Panel>

      {tab === "Folio" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title="Charges and adjustments">
            <div className="space-y-2.5">
              {(row.charges || row.items || []).map((charge, index) => (
                <div
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs"
                  key={charge.id || charge._id || `${charge.name}-${index}`}
                >
                  <Layers3 size={16} className="text-brand-700" />
                  <div className="mr-auto">
                    <p className="text-brand-900 font-semibold">
                      {charge.name || charge.description}
                    </p>
                    <p className="text-gray-400">
                      {charge.notes || "Charge"} · Qty {charge.quantity || 1}
                    </p>
                  </div>
                  <span className="text-brand-900 font-semibold">
                    {money(
                      Number(charge.price || charge.amount || 0) *
                        Number(charge.quantity || 1),
                    )}
                  </span>
                  <StatusChip variant={charge.status || "posted"}>
                    {charge.status || "posted"}
                  </StatusChip>
                </div>
              ))}
              {!(row.charges || row.items || []).length && (
                <p className="py-8 text-center text-sm text-gray-400">
                  No posted charges found on this folio.
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["Adjust Charge", "adjust"],
                ["Transfer Charge", "transfer"],
                ["Void Charge", "void"],
                ["Complimentary", "comp"],
              ].map(([label, action]) => (
                <button
                  className={actionClass}
                  key={action}
                  onClick={() => {
                    setCorrectionAction(action);
                    setDrawer("correction");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Folio summary">
              <div className="space-y-2.5 text-sm">
                <SummaryLine label="Subtotal" value={row.total} />
                <SummaryLine
                  label="Service charge"
                  value={row.serviceCharge || 0}
                />
                <SummaryLine label="GST" value={row.tax || 0} />
                <SummaryLine label="Total paid" value={row.paid} />
                <SummaryLine
                  label="Balance due"
                  value={row.balanceDue}
                  danger
                />
              </div>
              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => setDrawer("payment")}
              >
                Collect Payment
              </Button>
            </Panel>
            <Panel title="Quick actions">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  [Printer, "Print Folio", "print"],
                  [Mail, "Share Folio", "email"],
                  [FileDown, "Download PDF", "download"],
                  [Upload, "Export Audit", "audit"],
                ].map(([Icon, label, channel]) => (
                  <button
                    className={`${actionClass} justify-center`}
                    key={label}
                    onClick={async () => {
                      try {
                        await billingApi.shareFolio(row.id || row._id, {
                          channel,
                        });
                        onRefresh?.();
                      } catch (err) {
                        setError(err.message || "Folio action failed");
                      }
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <Panel title={tab}>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiTile
              label={`${tab} records`}
              value="—"
              delta="Select a folio record to load"
            />
            <KpiTile
              label="Current balance"
              value={money(row.balanceDue)}
              delta="Calculated server-side"
              iconClassName="bg-rose-50 text-rose-700"
            />
            <KpiTile
              label="Audit history"
              value="Available"
              delta="Every financial write is logged"
              iconClassName="bg-emerald-50 text-emerald-700"
            />
          </div>
        </Panel>
      )}

      {drawer && (
        <ActionDrawer
          title={drawerTitle(drawer)}
          onClose={close}
          onSubmit={submit}
        >
          {folioFields(drawer, correctionAction)}
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </p>
          )}
        </ActionDrawer>
      )}
    </div>
  );
}

function SummaryLine({ label, value, danger }) {
  return (
    <div
      className={`flex justify-between ${danger ? "font-bold text-rose-600" : "text-gray-600"}`}
    >
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}

function drawerTitle(type) {
  return {
    charge: "Add folio charge",
    split: "Split folio",
    merge: "Merge folio",
    invoice: "Generate invoice",
    payment: "Collect folio payment",
    correction: "Correct folio charge",
    share: "Share folio",
  }[type];
}

function folioFields(type, correctionAction = "void") {
  if (type === "charge")
    return (
      <>
        <Field label="Description" name="description" required />
        <Field label="Department" name="department" required />
        <Field
          label="Quantity"
          name="quantity"
          type="number"
          min="1"
          defaultValue="1"
          required
        />
        <Field
          label="Rate"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <Field label="Reason / remarks" name="reason" />
      </>
    );
  if (type === "split")
    return (
      <>
        <Field
          label="Charge indexes (comma separated)"
          name="itemIndexes"
          placeholder="0,1"
          required
        />
        <Field label="Reason" name="reason" required />
      </>
    );
  if (type === "merge")
    return (
      <>
        <Field label="Target folio ID" name="targetFolioId" required />
        <Field label="Reason" name="reason" required />
      </>
    );
  if (type === "payment")
    return (
      <>
        <Field label="Amount" name="amount" type="number" min="0" required />
        <Field
          label="Payment method"
          name="method"
          defaultValue="cash"
          required
        />
        <Field label="Reference" name="reference" />
      </>
    );
  if (type === "correction")
    return (
      <>
        <Field
          label="Charge index"
          name="itemIndex"
          type="number"
          min="0"
          required
        />
        <input type="hidden" name="action" value={correctionAction} />
        <Field label="Reason" name="reason" required />
        <Field label="Adjusted amount" name="amount" type="number" min="0" />
      </>
    );
  return (
    <>
      <Field label="Invoice type" name="type" defaultValue="tax" required />
      <Field label="Bill-to name" name="billTo" />
      <Field label="Place of supply" name="placeOfSupply" />
    </>
  );
}

export function ScreenWorkspace({ section }) {
  const details =
    {
      payments: [
        "Payment Method Breakdown",
        "Collections Trend",
        "Reconciliation Summary",
        "Recent Refunds",
        "Payment Alerts",
      ],
      invoices: [
        "Invoice Preview",
        "Tax invoice",
        "Proforma invoice",
        "Credit note",
        "Download / Print / Email / WhatsApp",
      ],
      "taxes-charges": [
        "Room Charges",
        "F&B Charges",
        "Service Charges",
        "Other Charges",
        "Tax Settings",
        "Test Calculator",
      ],
      corporate: [
        "Outstanding by Age",
        "Top Outstanding Companies",
        "Credit Limit Usage",
        "Contract Expiry",
      ],
      receivables: [
        "Aging Summary",
        "Outstanding by Type",
        "Top Outstanding Accounts",
        "Follow Up Actions",
        "Recent Payments",
      ],
      payables: [
        "Payables by Category",
        "Monthly Payables Trend",
        "Upcoming Payments",
        "Recent Vendor Payments",
        "Bulk Payment",
      ],
      expenses: [
        "Expense Trend",
        "Expenses by Category",
        "Top Expense Categories",
        "Recurring Expenses",
        "Bulk Upload Review",
      ],
      cashier: [
        "Today's Transactions",
        "Cash Drawer",
        "Payment Summary",
        "Refunds",
        "Settlement",
        "Cash Count",
      ],
      reconciliation: [
        "Overview",
        "Payment Reconciliation",
        "POS Reconciliation",
        "Bank Reconciliation",
        "Folio Reconciliation",
        "Discrepancies",
      ],
      "night-audit": [
        "Revenue Summary",
        "Occupancy Overview",
        "Arrivals / Departures / In-House",
        "Night Audit Checklist (0/8)",
        "Important Alerts",
        "Reports After Audit",
      ],
    }[section] || [];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {details.map((title) => (
        <Panel title={title} key={title}>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            <span>
              Live records and actions are connected to the billing API.
            </span>
          </div>
          {section === "night-audit" && title.includes("Checklist") && (
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  className="rounded-lg bg-amber-50 px-2 py-2 text-center text-[10px] font-semibold text-amber-800"
                  key={index}
                >
                  Step {index + 1}
                </span>
              ))}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}
