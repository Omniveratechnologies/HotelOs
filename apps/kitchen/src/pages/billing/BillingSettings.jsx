import { useEffect, useState } from "react";
import {
  getBillingSettings,
  updateBillingSettings,
} from "../../services/billing.js";
import { Page, Panel, Notice, Tabs, css, money } from "./billingUi.jsx";

const TABS = [
  "general",
  "invoice",
  "paymentSettings",
  "taxSettings",
  "receiptSettings",
  "cancellation",
  "discountPermissions",
  "rounding",
  "invoiceDelivery",
];
const LABELS = {
  general: "General",
  invoice: "Invoice",
  paymentSettings: "Payment Settings",
  taxSettings: "Tax Settings",
  receiptSettings: "Receipt Settings",
  cancellation: "Cancellation",
  discountPermissions: "Discount Permissions",
  rounding: "Rounding",
  invoiceDelivery: "Invoice Delivery",
};

const defaults = {
  general: {
    billPrefix: "INV",
    startingNumber: 1001,
    invoiceNumberFormat: "INV-YYYY-######",
    currency: "INR",
    decimalPlaces: 2,
  },
  invoice: {
    restaurantName: "",
    address: "",
    gstin: "",
    phone: "",
    email: "",
    footer: "Thank you for visiting!",
  },
  paymentSettings: {
    cash: true,
    upi: true,
    card: true,
    netBanking: true,
    wallet: true,
    roomCharge: true,
    splitPayment: true,
    complimentary: false,
    gateway: "Razorpay",
    enableUpi: true,
    enableCardPayments: true,
    enableNetBanking: true,
    enableWallet: true,
    razorpayKeyId: "",
    razorpayKeySecret: "",
  },
  taxSettings: {
    enableGst: true,
    gstMode: "percentage",
    defaultGstRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    showBreakup: true,
    taxOnDiscounted: true,
    allowPerCategory: false,
  },
  receiptSettings: {
    autoPrint: true,
    printAfterPayment: true,
    kitchenCopy: true,
    customerCopy: true,
    showLogo: true,
    paperSize: "80mm (Thermal)",
    customerCopies: 1,
    kitchenCopies: 1,
    printFormat: "standard",
  },
  cancellation: {
    whoCanCancel: ["manager", "admin"],
    requireReason: true,
    allowItemLevel: true,
    logAudit: true,
  },
  discountPermissions: {
    cashier: 10,
    manager: 30,
    admin: 100,
    requireApproval: true,
  },
  rounding: { method: "nearest1" },
  invoiceDelivery: {
    print: true,
    email: true,
    whatsapp: true,
    sms: false,
    defaultMessage: "Thank you for dining with us at Hotel Grandview!",
  },
};

export default function BillingSettings() {
  const [settings, setSettings] = useState(defaults);
  const [tab, setTab] = useState("general");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBillingSettings()
      .then((value) =>
        setSettings((current) => ({
          ...current,
          ...Object.fromEntries(
            TABS.map((k) => [k, { ...defaults[k], ...value[k] }]),
          ),
        })),
      )
      .catch((e) => setError(e.message));
  }, []);

  const patch = (key, value) =>
    setSettings((all) => ({ ...all, [tab]: { ...all[tab], [key]: value } }));
  const patchList = (key, item, checked) =>
    setSettings((all) => {
      const list = new Set(all[tab][key] || []);
      if (checked) {
        list.add(item);
      } else {
        list.delete(item);
      }
      return { ...all, [tab]: { ...all[tab], [key]: [...list] } };
    });

  async function save() {
    try {
      await updateBillingSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  }

  const g = settings.general,
    inv = settings.invoice,
    pay = settings.paymentSettings,
    tax = settings.taxSettings,
    rec = settings.receiptSettings,
    can = settings.cancellation,
    disc = settings.discountPermissions,
    round = settings.rounding,
    deliv = settings.invoiceDelivery;
  const sampleInvoiceNo = `${g.invoiceNumberFormat.replace("YYYY", "2026").replace(/#+/g, String(g.startingNumber).padStart(6, "0"))}`;

  return (
    <Page
      title="Billing Settings"
      action={
        <button
          onClick={save}
          className="cursor-pointer rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950"
        >
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      }
    >
      <Notice text={error} onClose={() => setError("")} />
      <Tabs values={TABS} labels={LABELS} current={tab} onChange={setTab} />

      <div className="grid gap-5 pt-4 xl:grid-cols-[1fr_300px]">
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          {tab === "general" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Bill Prefix"
                value={g.billPrefix}
                onChange={(v) => patch("billPrefix", v)}
              />
              <Field
                label="Starting Number"
                type="number"
                value={g.startingNumber}
                onChange={(v) => patch("startingNumber", Number(v))}
              />
              <Field
                label="Invoice Number Format"
                value={g.invoiceNumberFormat}
                onChange={(v) => patch("invoiceNumberFormat", v)}
                hint="Use YYYY and # for digits"
              />
              <Field
                label="Sample Invoice No."
                value={sampleInvoiceNo}
                disabled
              />
              <label className="text-xs">
                Currency
                <select
                  className={css}
                  value={g.currency}
                  onChange={(e) => patch("currency", e.target.value)}
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                </select>
              </label>
              <Field
                label="Decimal Places"
                type="number"
                value={g.decimalPlaces}
                onChange={(v) => patch("decimalPlaces", Number(v))}
              />
            </div>
          )}

          {tab === "invoice" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Restaurant Name"
                value={inv.restaurantName}
                onChange={(v) => patch("restaurantName", v)}
              />
              <Field
                label="Address"
                value={inv.address}
                onChange={(v) => patch("address", v)}
              />
              <Field
                label="GSTIN"
                value={inv.gstin}
                onChange={(v) => patch("gstin", v)}
              />
              <Field
                label="Phone"
                value={inv.phone}
                onChange={(v) => patch("phone", v)}
              />
              <Field
                label="Email"
                value={inv.email}
                onChange={(v) => patch("email", v)}
              />
              <Field
                label="Invoice Footer"
                value={inv.footer}
                onChange={(v) => patch("footer", v)}
              />
            </div>
          )}

          {tab === "paymentSettings" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "cash",
                  "upi",
                  "card",
                  "netBanking",
                  "wallet",
                  "roomCharge",
                  "splitPayment",
                  "complimentary",
                ].map((key) => (
                  <Toggle
                    key={key}
                    label={key}
                    checked={!!pay[key]}
                    onChange={(v) => patch(key, v)}
                  />
                ))}
              </div>
              <label className="block text-xs">
                Payment Gateway
                <select
                  className={css}
                  value={pay.gateway}
                  onChange={(e) => patch("gateway", e.target.value)}
                >
                  <option>Razorpay</option>
                  <option>Cash Only</option>
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "enableUpi",
                  "enableCardPayments",
                  "enableNetBanking",
                  "enableWallet",
                ].map((key) => (
                  <Toggle
                    key={key}
                    label={key}
                    checked={!!pay[key]}
                    onChange={(v) => patch(key, v)}
                  />
                ))}
              </div>
              <Field
                label="Razorpay Key ID"
                value={pay.razorpayKeyId}
                onChange={(v) => patch("razorpayKeyId", v)}
              />
              <Field
                label="Razorpay Key Secret"
                type="password"
                value={pay.razorpayKeySecret}
                onChange={(v) => patch("razorpayKeySecret", v)}
              />
            </div>
          )}

          {tab === "taxSettings" && (
            <div className="space-y-4">
              <Toggle
                label="Enable GST"
                checked={!!tax.enableGst}
                onChange={(v) => patch("enableGst", v)}
              />
              <div className="flex gap-4 text-xs">
                {["percentage", "fixed", "none"].map((mode) => (
                  <label
                    key={mode}
                    className="flex cursor-pointer items-center gap-1.5 capitalize"
                  >
                    <input
                      type="radio"
                      name="gstMode"
                      checked={tax.gstMode === mode}
                      onChange={() => patch("gstMode", mode)}
                    />{" "}
                    {mode}
                  </label>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Default GST Rate (%)"
                  type="number"
                  value={tax.defaultGstRate}
                  onChange={(v) => patch("defaultGstRate", Number(v))}
                />
                <Field
                  label="CGST Rate (%)"
                  type="number"
                  value={tax.cgstRate}
                  onChange={(v) => patch("cgstRate", Number(v))}
                />
                <Field
                  label="SGST Rate (%)"
                  type="number"
                  value={tax.sgstRate}
                  onChange={(v) => patch("sgstRate", Number(v))}
                />
              </div>
              <Toggle
                label="Show tax breakup on invoice"
                checked={!!tax.showBreakup}
                onChange={(v) => patch("showBreakup", v)}
              />
              <Toggle
                label="Apply tax on discounted amount"
                checked={!!tax.taxOnDiscounted}
                onChange={(v) => patch("taxOnDiscounted", v)}
              />
              <Toggle
                label="Allow different tax rates per category"
                checked={!!tax.allowPerCategory}
                onChange={(v) => patch("allowPerCategory", v)}
              />
            </div>
          )}

          {tab === "receiptSettings" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "autoPrint",
                  "printAfterPayment",
                  "kitchenCopy",
                  "customerCopy",
                  "showLogo",
                ].map((key) => (
                  <Toggle
                    key={key}
                    label={key}
                    checked={!!rec[key]}
                    onChange={(v) => patch(key, v)}
                  />
                ))}
              </div>
              <label className="block text-xs">
                Paper Size
                <select
                  className={css}
                  value={rec.paperSize}
                  onChange={(e) => patch("paperSize", e.target.value)}
                >
                  <option>80mm (Thermal)</option>
                  <option>A4</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Customer Copies"
                  type="number"
                  value={rec.customerCopies}
                  onChange={(v) => patch("customerCopies", Number(v))}
                />
                <Field
                  label="Kitchen Copies"
                  type="number"
                  value={rec.kitchenCopies}
                  onChange={(v) => patch("kitchenCopies", Number(v))}
                />
              </div>
              <div className="flex gap-4 text-xs">
                {["standard", "compact"].map((f) => (
                  <label
                    key={f}
                    className="flex cursor-pointer items-center gap-1.5 capitalize"
                  >
                    <input
                      type="radio"
                      name="printFormat"
                      checked={rec.printFormat === f}
                      onChange={() => patch("printFormat", f)}
                    />{" "}
                    {f}
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === "cancellation" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-400">
                Who can cancel?
              </p>
              <div className="flex gap-4 text-xs">
                {["cashier", "manager", "admin"].map((role) => (
                  <label
                    key={role}
                    className="flex cursor-pointer items-center gap-1.5 capitalize"
                  >
                    <input
                      type="checkbox"
                      checked={can.whoCanCancel.includes(role)}
                      onChange={(e) =>
                        patchList("whoCanCancel", role, e.target.checked)
                      }
                    />{" "}
                    {role}
                  </label>
                ))}
              </div>
              <Toggle
                label="Require cancellation reason"
                checked={!!can.requireReason}
                onChange={(v) => patch("requireReason", v)}
              />
              <Toggle
                label="Allow item-level cancellation"
                checked={!!can.allowItemLevel}
                onChange={(v) => patch("allowItemLevel", v)}
              />
              <Toggle
                label="Log cancellation in audit history"
                checked={!!can.logAudit}
                onChange={(v) => patch("logAudit", v)}
              />
            </div>
          )}

          {tab === "discountPermissions" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Cashier max (%)"
                  type="number"
                  value={disc.cashier}
                  onChange={(v) => patch("cashier", Number(v))}
                />
                <Field
                  label="Manager max (%)"
                  type="number"
                  value={disc.manager}
                  onChange={(v) => patch("manager", Number(v))}
                />
                <Field
                  label="Admin max (%)"
                  type="number"
                  value={disc.admin}
                  onChange={(v) => patch("admin", Number(v))}
                />
              </div>
              <Toggle
                label="Require approval for discount above limit"
                checked={!!disc.requireApproval}
                onChange={(v) => patch("requireApproval", v)}
              />
            </div>
          )}

          {tab === "rounding" && (
            <div className="space-y-4">
              <div className="flex gap-4 text-xs">
                {["none", "nearest1", "nearest5", "nearest10"].map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="radio"
                      name="rounding"
                      checked={round.method === m}
                      onChange={() => patch("method", m)}
                    />{" "}
                    {m}
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                <p className="mb-1 font-semibold text-emerald-300">Example</p>
                <p>
                  Original Amount: ₹922.60 → Rounded Amount: ₹
                  {round.method === "none"
                    ? "922.60"
                    : round.method === "nearest1"
                      ? "923.00"
                      : round.method === "nearest5"
                        ? "925.00"
                        : "920.00"}
                </p>
              </div>
            </div>
          )}

          {tab === "invoiceDelivery" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {["print", "email", "whatsapp", "sms"].map((key) => (
                  <Toggle
                    key={key}
                    label={key}
                    checked={!!deliv[key]}
                    onChange={(v) => patch(key, v)}
                  />
                ))}
              </div>
              <label className="block text-xs">
                Default Message (WhatsApp/SMS)
                <textarea
                  className={css}
                  rows="3"
                  value={deliv.defaultMessage}
                  onChange={(e) => patch("defaultMessage", e.target.value)}
                />
              </label>
            </div>
          )}
        </section>

        <Panel title="Invoice Preview">
          <div className="rounded border border-slate-300 bg-white p-4 text-slate-900">
            <h3 className="text-center font-bold">
              {inv.restaurantName || "Hotel Grandview"}
            </h3>
            <p className="text-center text-[11px]">{inv.address}</p>
            {inv.gstin && (
              <p className="text-center text-[11px]">GSTIN: {inv.gstin}</p>
            )}
            <p className="text-center text-[11px]">{inv.phone}</p>
            <hr className="my-2" />
            <p className="mt-2 text-center font-semibold">Invoice</p>
            <p className="mt-2 text-xs">Bill No: {sampleInvoiceNo}</p>
            <p className="text-xs">Date: {new Date().toLocaleString()}</p>
            <div className="my-4 border-t border-slate-300 pt-3 text-xs">
              <p className="flex justify-between">
                <span>Chicken Biryani ×2</span>
                <span>{money(720)}</span>
              </p>
              <p className="flex justify-between">
                <span>Garlic Naan ×2</span>
                <span>{money(160)}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span>Sub Total</span>
                <span>{money(880)}</span>
              </p>
              <p className="flex justify-between">
                <span>GST ({tax.defaultGstRate}%)</span>
                <span>{money(880 * (tax.defaultGstRate / 100))}</span>
              </p>
            </div>
            <p className="flex justify-between border-t border-slate-300 pt-2 font-bold">
              <span>Total</span>
              <span>{money(880 * (1 + tax.defaultGstRate / 100))}</span>
            </p>
            <p className="mt-5 text-center text-xs">{inv.footer}</p>
          </div>
        </Panel>
      </div>
    </Page>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  hint,
}) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        className={`${css} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-text"}`}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {hint && (
        <small className="mt-1 block text-[10px] text-slate-500">{hint}</small>
      )}
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 p-3 text-xs capitalize">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />{" "}
      {label.replace(/([A-Z])/g, " $1").trim()}
    </label>
  );
}
