import { useEffect, useState } from "react";
import {
  getCategories,
  updateCategory,
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../../services/menuManagement.js";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCharges,
  createCharge,
  updateCharge,
  deleteCharge,
  getBillingSettings,
  updateBillingSettings,
} from "../../services/billing.js";
import { Page, Table, Notice, Tabs, css, idOf, useLoad } from "./billingUi.jsx";

export default function TaxDiscounts() {
  const [tab, setTab] = useState("tax");
  const {
    data: categories,
    setData: setCategories,
    error: catError,
  } = useLoad(getCategories);
  const {
    data: discounts,
    setData: setDiscounts,
    error: discError,
  } = useLoad(getDiscounts);
  const {
    data: coupons,
    setData: setCoupons,
    error: coupError,
  } = useLoad(getCoupons);
  const {
    data: charges,
    setData: setCharges,
    error: chargeError,
  } = useLoad(getCharges);
  const [settings, setSettings] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    getBillingSettings()
      .then((value) => setSettings(value.taxSettings || {}))
      .catch((e) => setErr(e.message));
  }, []);

  const error = catError || discError || coupError || chargeError;

  async function patchCategory(id, field, value) {
    try {
      const updated = await updateCategory(id, { [field]: Number(value) });
      setCategories((current) =>
        current.map((c) => (idOf(c) === idOf(updated) ? updated : c)),
      );
    } catch (e) {
      setErr(e.message);
    }
  }

  async function saveTaxSettings() {
    try {
      await updateBillingSettings({ taxSettings: settings });
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <Page title="Tax & Discounts">
      <Notice text={error || err} onClose={() => setErr("")} />
      <Tabs
        values={["tax", "discounts", "coupons", "offers", "charges"]}
        labels={{
          tax: "Tax Configuration",
          discounts: "Discounts",
          coupons: "Coupons",
          offers: "Offers",
          charges: "Service Charges",
        }}
        current={tab}
        onChange={setTab}
      />

      {tab === "tax" && (
        <div className="space-y-5 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs">
              Default GST Rate (%)
              <input
                className={css}
                type="number"
                value={settings.defaultGstRate ?? 5}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultGstRate: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-xs">
              Rounding Method
              <select
                className={css}
                value={settings.rounding || "nearest1"}
                onChange={(e) =>
                  setSettings({ ...settings, rounding: e.target.value })
                }
              >
                <option value="none">None</option>
                <option value="nearest1">Nearest ₹1</option>
              </select>
            </label>
            <label className="mt-6 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!settings.showBreakup}
                onChange={(e) =>
                  setSettings({ ...settings, showBreakup: e.target.checked })
                }
              />{" "}
              Show tax breakup on bill
            </label>
          </div>
          <button
            onClick={saveTaxSettings}
            className="cursor-pointer rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950"
          >
            Save Tax Settings
          </button>

          <div>
            <p className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
              Category-wise Tax Rates
              <a
                href="/menu-management/categories"
                className="cursor-pointer text-emerald-400"
              >
                + Add Category
              </a>
            </p>
            <Table
              rows={categories}
              columns={[
                { key: "name", label: "Category" },
                {
                  key: "gstRate",
                  label: "GST Rate",
                  render: (c) => (
                    <input
                      className="w-16 cursor-text rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs"
                      defaultValue={c.gstRate ?? 5}
                      onBlur={(e) =>
                        patchCategory(idOf(c), "gstRate", e.target.value)
                      }
                    />
                  ),
                },
                {
                  key: "cgstRate",
                  label: "CGST",
                  render: (c) => (
                    <input
                      className="w-16 cursor-text rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs"
                      defaultValue={c.cgstRate ?? 2.5}
                      onBlur={(e) =>
                        patchCategory(idOf(c), "cgstRate", e.target.value)
                      }
                    />
                  ),
                },
                {
                  key: "sgstRate",
                  label: "SGST",
                  render: (c) => (
                    <input
                      className="w-16 cursor-text rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs"
                      defaultValue={c.sgstRate ?? 2.5}
                      onBlur={(e) =>
                        patchCategory(idOf(c), "sgstRate", e.target.value)
                      }
                    />
                  ),
                },
                { key: "status", label: "Status" },
              ]}
            />
          </div>
        </div>
      )}

      {(tab === "discounts" || tab === "offers") && (
        <ResourceEditor
          title={
            tab === "offers"
              ? "Offers (shares data with Discounts)"
              : "Discounts"
          }
          rows={discounts}
          setRows={setDiscounts}
          create={createDiscount}
          update={updateDiscount}
          remove={deleteDiscount}
          onError={setErr}
          fields={[
            { key: "name", label: "Offer Name", type: "text" },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: ["percentage", "fixed", "buyXgetY", "combo"],
            },
            { key: "value", label: "Value", type: "number" },
            { key: "conditions", label: "Conditions", type: "text" },
            { key: "validity", label: "Validity", type: "text" },
          ]}
        />
      )}

      {tab === "coupons" && (
        <ResourceEditor
          title="Coupons"
          rows={coupons}
          setRows={setCoupons}
          create={createCoupon}
          update={updateCoupon}
          remove={deleteCoupon}
          onError={setErr}
          fields={[
            { key: "code", label: "Code", type: "text" },
            {
              key: "discountType",
              label: "Discount Type",
              type: "select",
              options: ["percentage", "fixed"],
            },
            { key: "value", label: "Value", type: "number" },
            { key: "minOrder", label: "Min Order", type: "number" },
            { key: "usageLimit", label: "Usage Limit", type: "number" },
          ]}
        />
      )}

      {tab === "charges" && (
        <ResourceEditor
          title="Service Charges"
          rows={charges}
          setRows={setCharges}
          create={createCharge}
          update={updateCharge}
          remove={deleteCharge}
          onError={setErr}
          fields={[
            { key: "name", label: "Charge Name", type: "text" },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: ["fixed", "percentage"],
            },
            { key: "value", label: "Value", type: "number" },
          ]}
        />
      )}
    </Page>
  );
}

function ResourceEditor({
  rows,
  setRows,
  create,
  update,
  remove,
  fields,
  onError,
}) {
  const [form, setForm] = useState(
    Object.fromEntries(
      fields.map((f) => [f.key, f.type === "select" ? f.options[0] : ""]),
    ),
  );

  async function add(e) {
    e.preventDefault();
    try {
      const payload = { ...form };
      fields.forEach((f) => {
        if (f.type === "number") payload[f.key] = Number(payload[f.key] || 0);
      });
      const created = await create(payload);
      setRows((current) => [created, ...current]);
      setForm(
        Object.fromEntries(
          fields.map((f) => [f.key, f.type === "select" ? f.options[0] : ""]),
        ),
      );
    } catch (e) {
      onError(e.message);
    }
  }
  async function toggle(row) {
    try {
      const updated = await update(idOf(row), { status: !row.status });
      setRows((current) =>
        current.map((r) => (idOf(r) === idOf(updated) ? updated : r)),
      );
    } catch (e) {
      onError(e.message);
    }
  }
  async function del(row) {
    try {
      await remove(idOf(row));
      setRows((current) => current.filter((r) => idOf(r) !== idOf(row)));
    } catch (e) {
      onError(e.message);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <form
        onSubmit={add}
        className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
      >
        {fields.map((f) =>
          f.type === "select" ? (
            <select
              key={f.key}
              className={`${css} max-w-[160px] cursor-pointer`}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            >
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              key={f.key}
              className={`${css} max-w-[160px]`}
              type={f.type}
              placeholder={f.label}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          ),
        )}
        <button className="cursor-pointer rounded-lg bg-emerald-400 px-4 text-xs font-bold text-slate-950">
          + Add
        </button>
      </form>
      <Table
        rows={rows}
        columns={[
          ...fields.map((f) => ({ key: f.key, label: f.label })),
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <button
                onClick={() => toggle(r)}
                className={`cursor-pointer text-xs ${r.status ? "text-emerald-400" : "text-slate-500"}`}
              >
                {r.status ? "Active" : "Inactive"}
              </button>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <button
                onClick={() => del(r)}
                className="cursor-pointer text-xs text-red-400"
              >
                Delete
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
