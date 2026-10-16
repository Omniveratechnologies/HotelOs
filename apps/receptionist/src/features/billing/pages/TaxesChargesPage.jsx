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
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, StatusPill, money } from "../billingUi.jsx";

const button =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm hover:border-blue-300";
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
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Taxes &amp; Charges
          </div>
          <h1 className="text-2xl font-bold">Taxes &amp; Charges</h1>
          <p className="text-xs text-slate-500">
            Configure and manage taxes, service charges and other charges
            applied to rooms, POS and services.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => {
              setSelected(null);
              setDrawer("rule");
            }}
          >
            <Plus size={14} /> Add Tax / Charge
          </button>
          <button className={button} onClick={() => setSettingsOpen(true)}>
            <Settings2 size={14} /> Tax Settings
          </button>
        </div>
      </header>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="GST (Total)"
          value={`${gst || 18}%`}
          detail="CGST 9% + SGST 9%"
          tone="green"
          icon={CheckCircle2}
        />
        <Kpi
          label="Service Charge"
          value={`${allRules.find((rule) => rule.type === "service_charge")?.rate || 10}%`}
          detail="Applicable on F&B"
          tone="blue"
          icon={ShieldCheck}
        />
        <Kpi
          label="Luxury Tax"
          value={`${allRules.find((rule) => /luxury/i.test(rule.name))?.rate || 0}%`}
          detail="Currently disabled"
          tone="amber"
          icon={ToggleLeft}
        />
        <Kpi
          label="Other Charges"
          value={quick.other.length}
          detail="Active charges"
          tone="purple"
          icon={MoreHorizontal}
        />
        <Kpi
          label="Total Active"
          value={active}
          detail="Taxes & charges"
          tone="red"
          icon={ShieldCheck}
        />
      </div>
      <div className="mb-3 flex overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {categories.map(([key, label]) => (
          <button
            className={`rounded-md px-5 py-2 text-[11px] font-bold whitespace-nowrap ${category === key ? "bg-[#102b5c] text-white" : "text-slate-500"}`}
            key={key}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,.8fr)]">
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
      <div className="mt-3 grid gap-2 lg:grid-cols-3">
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

function Kpi({ label, value, detail, tone, icon: Icon }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-violet-50 text-violet-600",
    red: "bg-rose-50 text-rose-600",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex justify-between">
        <span
          className={`grid size-9 place-items-center rounded-lg ${colors[tone]}`}
        >
          <Icon size={17} />
        </span>
        <div className="text-right">
          <b className="block text-xl">{value}</b>
          <span className="text-[10px] text-slate-400">{detail}</span>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold">{label}</p>
    </article>
  );
}
function RulesTable({ rules, selected, onSelect, onAdd, onToggle }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-3">
        <div>
          <h2 className="border-l-2 border-amber-500 pl-2 text-sm font-bold">
            Room Taxes &amp; Charges
          </h2>
          <p className="mt-1 text-[10px] text-slate-500">
            Configure taxes and additional charges applicable to room tariffs.
          </p>
        </div>
        <button className={button} onClick={onAdd}>
          <Plus size={13} /> Add Room Tax / Charge
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-[10px]">
          <thead className="bg-slate-50 text-slate-500 uppercase">
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
                <th className="px-3 py-3 font-semibold" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr
                className={`border-b border-slate-50 ${selected?.id === rule.id ? "bg-blue-50/50" : ""}`}
                key={rule.id}
                onClick={() => onSelect(rule)}
              >
                <td className="px-3 py-3 font-semibold">{rule.name}</td>
                <td className="px-3 py-3">{typeLabel(rule.type)}</td>
                <td className="px-3 py-3">
                  {rule.type === "fixed_charge"
                    ? money(rule.fixedAmount)
                    : `${rule.rate || 0}%`}
                </td>
                <td className="px-3 py-3">{calcLabel(rule.calcMethod)}</td>
                <td className="px-3 py-3">
                  {departmentLabel(rule.applicableOn)}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(rule);
                    }}
                  >
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${rule.active ? "justify-end bg-emerald-500" : "justify-start bg-slate-300"}`}
                    >
                      <span className="size-4 rounded-full bg-white" />
                    </span>
                  </button>
                </td>
                <td className="px-3 py-3">
                  <button
                    className="rounded border border-slate-200 p-1"
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
          <p className="p-10 text-center text-xs text-slate-400">
            No rules configured for this category.
          </p>
        )}
      </div>
    </section>
  );
}
function EditRule({ rule, onSave, onClose }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="border-l-2 border-amber-500 pl-2 text-sm font-bold">
          Edit Tax / Charge
        </h2>
        {rule && <button onClick={onClose}>×</button>}
      </div>
      {rule ? (
        <>
          <div className="mt-3 space-y-3 text-xs">
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
            <StatusPill value={rule.status} />
          </div>
          <button
            className="mt-4 w-full rounded-lg bg-[#102b5c] py-2 text-xs font-bold text-white"
            onClick={onSave}
          >
            <Edit3 size={13} className="mr-1 inline" /> Edit Rule
          </button>
        </>
      ) : (
        <p className="py-12 text-center text-xs text-slate-400">
          Select a rule to edit or add a new tax / charge.
        </p>
      )}
    </aside>
  );
}
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-50 pb-2">
      <span className="text-slate-500">{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
function QuickList({ title, description, rows, onAdd }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex justify-between">
        <div>
          <h3 className="border-l-2 border-amber-500 pl-2 text-sm font-bold">
            {title}
          </h3>
          <p className="mt-1 text-[10px] text-slate-500">{description}</p>
        </div>
        <button className={button} onClick={onAdd}>
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="mt-3">
        {rows.slice(0, 5).map((rule) => (
          <div
            className="flex items-center justify-between border-b border-slate-50 py-2 text-[10px]"
            key={rule.id}
          >
            <span>{rule.name}</span>
            <span>
              {rule.type === "fixed_charge"
                ? money(rule.fixedAmount)
                : `${rule.rate || 0}%`}
            </span>
            <StatusPill value={rule.status} />
          </div>
        ))}
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
      <Field label="Name" name="name" defaultValue={rule?.name} required />
      <label className="block text-xs font-semibold text-slate-600">
        Type
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
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
      <label className="block text-xs font-semibold text-slate-600">
        Calculation Method
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
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
      <label className="block text-xs font-semibold text-slate-600">
        Applicable On
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
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
      <label className="flex gap-2 text-xs">
        <input
          type="checkbox"
          name="compound"
          defaultChecked={rule?.compound}
        />{" "}
        Apply tax on service charge
      </label>
      <label className="flex gap-2 text-xs">
        <input
          type="checkbox"
          name="active"
          defaultChecked={rule?.active ?? true}
        />{" "}
        Active
      </label>
      <div className="rounded-lg bg-blue-50 p-3 text-[10px] text-blue-700">
        <Info size={13} className="mr-1 inline" /> This tax will be
        automatically applied to future charges for the selected department.
      </div>
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
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
      <label className="flex gap-2 text-xs">
        <input
          type="checkbox"
          name="taxInclusivePricing"
          defaultChecked={settings.taxInclusivePricing}
        />{" "}
        Tax-inclusive pricing
      </label>
      <label className="block text-xs font-semibold text-slate-600">
        Rounding mode
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal"
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
      <label className="flex gap-2 text-xs">
        <input
          type="checkbox"
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
