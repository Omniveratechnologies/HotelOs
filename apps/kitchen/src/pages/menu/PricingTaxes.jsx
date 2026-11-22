import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import useMenuItems from "../../hooks/useMenuItems.js";
import { updateMenuItem } from "../../services/menu.js";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../../services/menuManagement.js";

const css =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const tabs = [
  "Item Pricing",
  "GST Settings",
  "Additional Charges",
  "Discounts & Offers",
  "Time-based Pricing",
  "Channel Pricing",
  "Price Rules",
];

export default function PricingTaxes() {
  const { items, setItems, error: itemError } = useMenuItems();
  const [selectedId, setSelectedId] = useState("");
  const [discounts, setDiscounts] = useState([]);
  const [rules, setRules] = useState([]);
  const [tab, setTab] = useState("Item Pricing");
  const [error, setError] = useState("");
  const selected = items.find((item) => item.id === selectedId) || items[0];

  useEffect(() => {
    Promise.all([getDiscounts(), getPricingRules()])
      .then(([offers, pricing]) => {
        setDiscounts(offers);
        setRules(pricing);
      })
      .catch((e) => setError(e.message));
  }, []);
  const update = async (body) => {
    const saved = await updateMenuItem(selected.id, body);
    setItems((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
  };
  const finalPrice = useMemo(() => {
    if (!selected) return 0;
    const tax =
      selected.gstMode === "percentage"
        ? (selected.price * (selected.gst || 0)) / 100
        : selected.gstMode === "fixed"
          ? selected.gst || 0
          : 0;
    return selected.price + tax + (selected.charges || 0);
  }, [selected]);
  const content =
    tab === "Item Pricing" ? (
      <ItemPricing
        items={items}
        selected={selected}
        setSelectedId={setSelectedId}
        update={update}
        finalPrice={finalPrice}
      />
    ) : tab === "Discounts & Offers" ? (
      <Crud
        title="Discounts & Offers"
        rows={discounts}
        setRows={setDiscounts}
        blank={{
          name: "",
          type: "percentage",
          value: 0,
          conditions: "",
          validity: "",
          status: true,
        }}
        create={createDiscount}
        update={updateDiscount}
        remove={deleteDiscount}
      />
    ) : tab === "Time-based Pricing" ? (
      <Crud
        title="Time-based Pricing"
        rows={rules}
        setRows={setRules}
        blank={{
          name: "",
          startTime: "08:00",
          endTime: "11:00",
          specialPrice: 0,
          validDays: [],
          status: true,
        }}
        create={createPricingRule}
        update={updatePricingRule}
        remove={deletePricingRule}
      />
    ) : (
      <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-400">
        Coming soon
      </p>
    );
  return (
    <main className="min-h-full bg-[#07131f] p-4 text-slate-100 md:p-6">
      <header className="mb-5">
        <p className="text-xs tracking-[.22em] text-emerald-400 uppercase">
          Menu Management
        </p>
        <h1 className="text-2xl font-bold">Pricing & Taxes</h1>
      </header>
      <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-800">
        {tabs.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`border-b-2 px-3 py-3 text-xs whitespace-nowrap ${tab === name ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-500"}`}
          >
            {name}
          </button>
        ))}
      </nav>
      {(error || itemError) && <Notice text={error || itemError} />}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Menu Items" value={items.length} />
        <Stat label="Default GST Rate" value="5%" />
        <Stat
          label="Additional Charges"
          value={
            items.filter((item) =>
              item.additionalCharges?.some((charge) => charge.status),
            ).length
          }
        />
        <Stat
          label="Active Discounts"
          value={discounts.filter((row) => row.status).length}
        />
        <Stat label="Pricing Calculator" value="Ready" />
      </div>
      {content}
    </main>
  );
}

function ItemPricing({ items, selected, setSelectedId, update, finalPrice }) {
  if (!selected) return <Empty />;
  return (
    <div className="grid gap-4 xl:grid-cols-[240px_1fr_280px]">
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="mb-3 font-bold">Menu Items</h2>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={`mb-1 block w-full rounded p-2 text-left text-sm ${selected.id === item.id ? "bg-emerald-500/15" : "hover:bg-slate-800"}`}
          >
            {item.name}
            <small className="block text-slate-500">Rs. {item.price}</small>
          </button>
        ))}
      </section>
      <div className="space-y-4">
        <Card title="Base Pricing">
          <Field
            label="Base Price (Rs.)"
            value={selected.price}
            onChange={(value) => update({ price: Number(value) })}
          />
        </Card>
        <Card title="GST Settings">
          <select
            className={css}
            value={selected.gstMode || "percentage"}
            onChange={(e) => update({ gstMode: e.target.value })}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="none">No GST</option>
          </select>
          <Field
            label="GST Rate"
            value={selected.gst || 0}
            onChange={(value) => update({ gst: Number(value) })}
          />
        </Card>
        <Card title="Additional Charges">
          <Field
            label="Charges (Rs.)"
            value={selected.charges || 0}
            onChange={(value) => update({ charges: Number(value) })}
          />
        </Card>
        <Card title="Channel Pricing">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["dineIn", "Dine-in"],
              ["takeaway", "Takeaway"],
              ["delivery", "Delivery"],
              ["roomService", "Room Service"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={selected.channelPricing?.[key]?.price || selected.price}
                onChange={(value) =>
                  update({
                    channelPricing: {
                      ...selected.channelPricing,
                      [key]: {
                        ...selected.channelPricing?.[key],
                        price: Number(value),
                        active: true,
                      },
                    },
                  })
                }
              />
            ))}
          </div>
        </Card>
      </div>
      <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <h2 className="font-bold text-emerald-300">Final Price Preview</h2>
        <p className="mt-8 text-3xl font-bold text-emerald-400">
          ₹{finalPrice.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-slate-400">Base + GST + charges</p>
      </section>
    </div>
  );
}
function Crud({ title, rows, setRows, blank, create, update, remove }) {
  const [editing, setEditing] = useState(null);
  const save = async () => {
    const saved = editing.id
      ? await update(editing.id, editing)
      : await create(editing);
    setRows((current) =>
      editing.id
        ? current.map((row) => (row.id === saved.id ? saved : row))
        : [...current, saved],
    );
    setEditing(null);
  };
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-4 flex justify-between">
        <h2 className="font-bold">{title}</h2>
        <button
          onClick={() => setEditing({ ...blank })}
          className="rounded bg-emerald-400 p-2 text-slate-950"
        >
          <Plus size={14} />
        </button>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="mb-2 flex items-center gap-3 rounded border border-slate-800 p-3 text-sm"
        >
          <span className="flex-1">
            {row.name} {row.specialPrice ? `Rs.${row.specialPrice}` : row.value}
          </span>
          <button
            onClick={() =>
              update(row.id, { status: !row.status }).then((saved) =>
                setRows((current) =>
                  current.map((item) => (item.id === saved.id ? saved : item)),
                ),
              )
            }
            className="text-emerald-400"
          >
            {row.status ? "Active" : "Inactive"}
          </button>
          <button onClick={() => setEditing({ ...row })}>Edit</button>
          <button
            onClick={() =>
              remove(row.id).then(() =>
                setRows((current) =>
                  current.filter((item) => item.id !== row.id),
                ),
              )
            }
            className="text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {editing && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.keys(blank)
            .filter((key) => key !== "status" && key !== "validDays")
            .map((key) => (
              <Field
                key={key}
                label={key}
                value={editing[key]}
                onChange={(value) =>
                  setEditing({
                    ...editing,
                    [key]: ["value", "specialPrice"].includes(key)
                      ? Number(value)
                      : value,
                  })
                }
              />
            ))}
          <button
            onClick={save}
            className="rounded bg-emerald-400 px-3 py-2 font-bold text-slate-950"
          >
            Save
          </button>
        </div>
      )}
    </section>
  );
}
function Field({ label, value, onChange }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        className={`${css} mt-1`}
        type={typeof value === "number" ? "number" : "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="mb-3 font-bold">{title}</h2>
      {children}
    </section>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
function Notice({ text }) {
  return (
    <p className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      {text}
    </p>
  );
}
function Empty() {
  return (
    <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-400">
      No menu items found.
    </p>
  );
}
