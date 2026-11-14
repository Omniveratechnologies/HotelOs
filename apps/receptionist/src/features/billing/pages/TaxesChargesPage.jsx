import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  CheckCircle2,
  Edit3,
  Info,
  MoreHorizontal,
  Plus,
  Settings2,
  ShieldCheck,
  ToggleLeft,
} from "lucide-react";
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
} from "@hotelos/ui/components";
import { formatCurrency as money } from "@hotelos/utils";
import { billingApi } from "../api/billingApi.js";
import { ActionDrawer, Field, BillingPageSkeleton } from "../components";

const categories = [
  ["room", "Room Charges"],
  ["fnb", "F&B Charges"],
  ["service", "Service Charges"],
  ["other", "Other Charges"],
];

export default function TaxesChargesPage() {
  const [category, setCategory] = useState("room");
  const [selected, setSelected] = useState(null);
  const [drawer, setDrawer] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rulesQuery = useQuery({
    queryKey: ["billing", "tax-rules", category],
    queryFn: () => billingApi.taxRules({ applicable_on: category }),
  });
  const settingsQuery = useQuery({
    queryKey: ["billing", "tax-settings"],
    queryFn: billingApi.taxSettings,
  });
  const rules = rulesQuery.data || [];
  const allRulesQuery = useQuery({
    queryKey: ["billing", "tax-rules", "all"],
    queryFn: () => billingApi.taxRules(),
  });
  const allRules = allRulesQuery.data || rules;
  const active = allRules.filter((rule) => rule.active).length;
  const gst = allRules
    .filter((rule) => rule.taxGroup === "GST" && rule.type === "tax")
    .reduce((total, rule) => total + Number(rule.rate || 0), 0);
  const quick = useMemo(
    () => ({
      fnb: allRules.filter((rule) => rule.applicableOn === "fnb"),
      service: allRules.filter((rule) => rule.applicableOn === "service"),
      other: allRules.filter((rule) => rule.applicableOn === "other"),
    }),
    [allRules],
  );

  const refresh = () => {
    rulesQuery.refetch();
    allRulesQuery.refetch();
    settingsQuery.refetch();
    setDrawer("");
    setSelected(null);
  };

  return (
    <div>
      <Header
        pageTitle="Taxes, Surcharges & Extra Fees"
        pageDescription="Configure and manage taxes, service charges and other charges applied to rooms, POS and services."
      >
        <Button
          variant="primary"
          size="sm"
          className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
          onClick={() => {
            setSelected(null);
            setDrawer("rule");
          }}
          disabled={rulesQuery.isLoading}
        >
          <Plus size={14} /> Add Tax / Charge
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gray-200 text-gray-700"
          onClick={() => setSettingsOpen(true)}
          disabled={rulesQuery.isLoading}
        >
          <Settings2 size={14} /> Tax Settings
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        {rulesQuery.isError ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            Taxes & charges could not be loaded.
          </div>
        ) : rulesQuery.isLoading ? (
          <BillingPageSkeleton kpis={5} tableRows={5} />
        ) : (
          <>
            <KpiTileRow>
              <KpiTile
                title="GST (Total)"
                value={`${gst || 18}%`}
                subtitle="CGST 9% + SGST 9%"
                icon={CheckCircle2}
              />
              <KpiTile
                title="Service Charge"
                value={`${allRules.find((rule) => rule.type === "service_charge")?.rate || 10}%`}
                subtitle="Applicable on F&B"
                icon={ShieldCheck}
              />
              <KpiTile
                title="Luxury Tax"
                value={`${allRules.find((rule) => /luxury/i.test(rule.name))?.rate || 0}%`}
                subtitle="Currently disabled"
                icon={ToggleLeft}
              />
              <KpiTile
                title="Other Charges"
                value={quick.other.length}
                subtitle="Active charges"
                icon={MoreHorizontal}
              />
              <KpiTile
                title="Total Active"
                value={active}
                subtitle="Taxes & charges"
                icon={ShieldCheck}
              />
            </KpiTileRow>

            <div className="flex flex-wrap gap-2">
              {categories.map(([key, label]) => (
                <button
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                    category === key
                      ? "bg-brand-900 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  key={key}
                  onClick={() => setCategory(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,.8fr)]">
              <RulesTable
                rules={rules}
                selected={selected}
                onSelect={setSelected}
                onAdd={() => {
                  setSelected(null);
                  setDrawer("rule");
                }}
                onToggle={async (rule) => {
                  await billingApi.toggleTaxRule(rule.id, !rule.active);
                  refresh();
                }}
              />
              <EditRule
                rule={selected}
                onSave={() => setDrawer("rule")}
                onClose={() => setSelected(null)}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <QuickList
                title="F&B Taxes & Charges"
                description="Taxes and service charges for restaurant, bar and room service."
                rows={quick.fnb}
                onAdd={() => setDrawer("rule")}
              />
              <QuickList
                title="Service Taxes & Charges"
                description="Taxes for laundry, spa, minibar and other hotel services."
                rows={quick.service}
                onAdd={() => setDrawer("rule")}
              />
              <QuickList
                title="Other Charges"
                description="Additional charges like damage, extra bed, early check-in etc."
                rows={quick.other}
                onAdd={() => setDrawer("rule")}
              />
            </div>
          </>
        )}
      </div>

      {drawer === "rule" && (
        <RuleDrawer
          rule={selected}
          onClose={() => setDrawer("")}
          onComplete={refresh}
        />
      )}
      {settingsOpen && (
        <SettingsDrawer
          settings={settingsQuery.data || {}}
          onClose={() => setSettingsOpen(false)}
          onComplete={() => {
            setSettingsOpen(false);
            settingsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}

function RulesTable({ rules, selected, onSelect, onAdd, onToggle }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Room Taxes &amp; Charges
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Configure taxes and additional charges applicable to room tariffs.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-gray-200 text-gray-700"
          onClick={onAdd}
        >
          <Plus size={13} /> Add Tax / Charge
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            <tr>
              {[
                "Name",
                "Type",
                "Rate / Amount",
                "Calculation",
                "Applicable On",
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
            {rules.map((rule) => (
              <tr
                className={`hover:bg-primary-50/20 cursor-pointer ${selected?.id === rule.id ? "bg-primary-50/30" : ""}`}
                key={rule.id}
                onClick={() => onSelect(rule)}
              >
                <td className="text-brand-900 px-4 py-3 font-semibold">
                  {rule.name}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {typeLabel(rule.type)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {rule.type === "fixed_charge"
                    ? money(rule.fixedAmount)
                    : `${rule.rate || 0}%`}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {calcLabel(rule.calcMethod)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {departmentLabel(rule.applicableOn)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(rule);
                    }}
                  >
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${rule.active ? "justify-end bg-emerald-500" : "justify-start bg-gray-300"}`}
                    >
                      <span className="size-4 rounded-full bg-white shadow-sm" />
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(rule);
                    }}
                  >
                    <Edit3 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rules.length && (
          <p className="p-10 text-center text-xs text-gray-400">
            No rules configured for this category.
          </p>
        )}
      </div>
    </section>
  );
}

function EditRule({ rule, onSave, onClose }) {
  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-sm font-bold text-gray-900">Edit Tax / Charge</h2>
        {rule && (
          <button
            className="text-lg leading-none text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      {rule ? (
        <>
          <div className="mt-4 space-y-3 text-xs">
            <InfoRow label="Name" value={rule.name} />
            <InfoRow label="Type" value={typeLabel(rule.type)} />
            <InfoRow
              label="Rate / Amount"
              value={
                rule.type === "fixed_charge"
                  ? money(rule.fixedAmount)
                  : `${rule.rate}%`
              }
            />
            <InfoRow label="Calculation" value={calcLabel(rule.calcMethod)} />
            <InfoRow
              label="Applicable On"
              value={departmentLabel(rule.applicableOn)}
            />
            <InfoRow label="Tax Group" value={rule.taxGroup} />
            <InfoRow label="Version" value={`v${rule.version}`} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-500">Status</span>
              <StatusChip status={rule.active ? "active" : "inactive"} />
            </div>
          </div>
          <Button
            variant="primary"
            className="bg-brand-900 hover:bg-brand-950 mt-6 w-full text-white"
            onClick={onSave}
          >
            <Edit3 size={13} className="mr-1.5 inline" /> Edit Rule
          </Button>
        </>
      ) : (
        <p className="py-14 text-center text-xs text-gray-400">
          Select a rule to view details or edit.
        </p>
      )}
    </aside>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-2">
      <span className="text-gray-500">{label}</span>
      <b className="text-gray-900">{value || "—"}</b>
    </div>
  );
}

function QuickList({ title, description, rows, onAdd }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0 gap-1 border-gray-200 text-gray-700"
          onClick={onAdd}
        >
          <Plus size={12} /> Add
        </Button>
      </div>
      <div className="mt-4 divide-y divide-gray-100">
        {rows.slice(0, 5).map((rule) => (
          <div
            className="flex items-center justify-between py-2 text-xs"
            key={rule.id}
          >
            <span className="font-medium text-gray-800">{rule.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">
                {rule.type === "fixed_charge"
                  ? money(rule.fixedAmount)
                  : `${rule.rate || 0}%`}
              </span>
              <StatusChip status={rule.active ? "active" : "inactive"} />
            </div>
          </div>
        ))}
        {!rows.length && (
          <p className="py-4 text-center text-xs text-gray-400">
            No charges configured.
          </p>
        )}
      </div>
    </section>
  );
}

function RuleDrawer({ rule, onClose, onComplete }) {
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    body.active = body.active === "on";
    try {
      if (rule) await billingApi.updateTaxRule(rule.id, body);
      else await billingApi.createTaxRule(body);
      onComplete();
    } catch (requestError) {
      setError(requestError.message || "Tax rule could not be saved.");
    }
  };
  return (
    <ActionDrawer
      title={rule ? "Edit Tax / Charge" : "Add Tax / Charge"}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Save Changes"
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <Field label="Name" name="name" defaultValue={rule?.name} required />
      <label className="block text-xs font-semibold text-gray-700">
        Type
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal text-gray-800 focus:ring-1 focus:outline-none"
          name="type"
          defaultValue={rule?.type || "tax"}
        >
          <option value="tax">Tax</option>
          <option value="service_charge">Service Charge</option>
          <option value="fixed_charge">Fixed Charge</option>
        </select>
      </label>
      <Field
        label="Rate (%)"
        name="rate"
        type="number"
        min="0"
        max="100"
        step="0.01"
        defaultValue={rule?.rate || 0}
      />
      <Field
        label="Fixed amount"
        name="fixedAmount"
        type="number"
        min="0"
        step="0.01"
        defaultValue={rule?.fixedAmount || 0}
      />
      <label className="block text-xs font-semibold text-gray-700">
        Calculation Method
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal text-gray-800 focus:ring-1 focus:outline-none"
          name="calcMethod"
          defaultValue={rule?.calcMethod || "on_base"}
        >
          <option value="on_base">On Base Amount</option>
          <option value="on_base_plus_service">On Base + Service</option>
          <option value="per_room_per_night">Per Room Per Night</option>
          <option value="per_pax">Per Pax</option>
          <option value="flat">Flat</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-gray-700">
        Applicable On
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal text-gray-800 focus:ring-1 focus:outline-none"
          name="applicableOn"
          defaultValue={rule?.applicableOn || "room"}
        >
          <option value="room">Room Tariff</option>
          <option value="fnb">F&B</option>
          <option value="service">Service</option>
          <option value="other">Other</option>
        </select>
      </label>
      <Field
        label="Tax Group"
        name="taxGroup"
        defaultValue={rule?.taxGroup || "GST"}
      />
      <Field label="HSN / SAC" name="hsnSac" defaultValue={rule?.hsnSac} />
      <Field label="Effective from" name="effectiveFrom" type="date" />
      <Field label="Slab minimum" name="slabMin" type="number" min="0" />
      <Field label="Slab maximum" name="slabMax" type="number" min="0" />
      <Field
        label="Description"
        name="description"
        defaultValue={rule?.description}
      />
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
          name="compound"
          defaultChecked={rule?.compound}
        />{" "}
        Apply tax on service charge
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
          name="active"
          defaultChecked={rule?.active ?? true}
        />{" "}
        Active
      </label>
      <div className="bg-primary-50 border-primary-100 text-primary-800 rounded-lg border p-3 text-xs">
        <Info size={14} className="mr-1.5 inline" /> This tax will be
        automatically applied to future charges for the selected department.
      </div>
    </ActionDrawer>
  );
}

function SettingsDrawer({ settings, onClose, onComplete }) {
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    await billingApi.updateTaxSettings({
      taxInclusivePricing: body.taxInclusivePricing === "on",
      roundingMode: body.roundingMode,
      gstin: body.gstin,
      stateCode: body.stateCode,
      eInvoiceEnabled: body.eInvoiceEnabled === "on",
    });
    onComplete();
  };
  return (
    <ActionDrawer title="Tax Settings" onClose={onClose} onSubmit={submit}>
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
          name="taxInclusivePricing"
          defaultChecked={settings.taxInclusivePricing}
        />{" "}
        Tax-inclusive pricing
      </label>
      <label className="block text-xs font-semibold text-gray-700">
        Rounding mode
        <select
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal text-gray-800 focus:ring-1 focus:outline-none"
          name="roundingMode"
          defaultValue={settings.rounding?.mode || "nearest"}
        >
          <option value="nearest">Nearest paise</option>
          <option value="up">Round up</option>
          <option value="down">Round down</option>
        </select>
      </label>
      <Field label="GSTIN" name="gstin" defaultValue={settings.gstin} />
      <Field
        label="State code"
        name="stateCode"
        defaultValue={settings.stateCode}
      />
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
          name="eInvoiceEnabled"
          defaultChecked={settings.eInvoiceEnabled}
        />{" "}
        Enable e-invoice integration
      </label>
    </ActionDrawer>
  );
}

function typeLabel(type) {
  return (
    {
      tax: "Tax",
      service_charge: "Service Charge",
      fixed_charge: "Fixed Charge",
    }[type] || type
  );
}

function calcLabel(type) {
  return (
    {
      on_base: "On Base Amount",
      on_base_plus_service: "On Base + Service",
      per_room_per_night: "Per Room Per Night",
      per_pax: "Per Pax",
      flat: "Flat",
    }[type] || type
  );
}

function departmentLabel(type) {
  return (
    { room: "Room Tariff", fnb: "F&B", service: "Services", other: "Other" }[
      type
    ] || type
  );
}
