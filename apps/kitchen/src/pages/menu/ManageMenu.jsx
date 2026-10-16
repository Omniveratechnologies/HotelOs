import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../services/menu.js";
import {
  getCategories,
  getModifierGroups,
} from "../../services/menuManagement.js";

const css =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-400";
const blank = {
  name: "",
  shortDescription: "",
  description: "",
  category: "",
  subCategory: "",
  categoryId: null,
  price: 0,
  foodType: "veg",
  gst: 5,
  gstMode: "percentage",
  charges: 0,
  additionalCharges: [],
  stock: 0,
  minStock: 0,
  maxStock: 0,
  trackInventory: false,
  isSpicy: false,
  isChefSpecial: false,
  isBestseller: false,
  isNewItem: true,
  isRoomServiceAvailable: true,
  isAvailable: true,
  tags: [],
  modifierGroupIds: [],
  kitchenStation: "Main Kitchen",
  prepTimeMinutes: 15,
  availabilityChannels: {
    dineIn: true,
    takeaway: true,
    delivery: true,
    roomService: true,
  },
  mealPeriods: [],
  timeAvailability: { enabled: false, slots: [] },
  dayAvailability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  stockRule: { enabled: false, ingredientName: "", currentQty: 0, minQty: 0 },
  temporaryAvailability: { available: true, reason: "" },
  images: [],
  image: "",
};
const tabs = [
  "Basic Info",
  "Pricing & Tax",
  "Inventory",
  "Modifiers",
  "Availability",
  "Other Settings",
];
const channels = [
  ["dineIn", "Dine-in"],
  ["takeaway", "Takeaway"],
  ["delivery", "Delivery"],
  ["roomService", "Room Service"],
];
function Field({ label, children }) {
  return (
    <label className="block text-xs text-slate-400">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-10 rounded-full ${checked ? "bg-emerald-500" : "bg-slate-700"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${checked ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}
function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

export default function ManageMenu() {
  const [items, setItems] = useState([]),
    [categories, setCategories] = useState([]),
    [groups, setGroups] = useState([]),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [foodType, setFoodType] = useState(""),
    [editing, setEditing] = useState(null),
    [tab, setTab] = useState(tabs[0]),
    [error, setError] = useState("");
  const load = async () => {
    try {
      const [menu, cats, modifiers] = await Promise.all([
        getMenuItems(),
        getCategories(),
        getModifierGroups(),
      ]);
      setItems(menu);
      setCategories(cats);
      setGroups(modifiers);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    load();
  }, []);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          `${item.name} ${item.subCategory || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (!category ||
            item.categoryId === category ||
            item.category ===
              categories.find((row) => row.id === category)?.name) &&
          (!status ||
            (status === "active" ? item.isAvailable : !item.isAvailable)) &&
          (!foodType || item.foodType === foodType),
      ),
    [items, categories, query, category, status, foodType],
  );
  const patch = (value) => setEditing((current) => ({ ...current, ...value }));
  const save = async () => {
    try {
      const saved = editing.id
        ? await updateMenuItem(editing.id, editing)
        : await createMenuItem(editing);
      setItems((current) =>
        editing.id
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
      setEditing(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const remove = async (id) => {
    try {
      await deleteMenuItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <main className="min-h-full bg-[#07131f] p-4 text-slate-100 md:p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[.22em] text-emerald-400 uppercase">
            Menu Management
          </p>
          <h1 className="mt-1 text-2xl font-bold">Manage Menu</h1>
          <p className="text-sm text-slate-400">
            Add, edit, enable/disable and manage all menu items.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ ...blank });
            setTab(tabs[0]);
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950"
        >
          <Plus size={16} /> Add Menu Item
        </button>
      </div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Stat label="Total Items" value={items.length} />
        <Stat
          label="Active Items"
          value={items.filter((item) => item.isAvailable).length}
        />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute top-3 left-3 text-slate-500"
            />
            <input
              className={`${css} pl-9`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menu items..."
            />
          </div>
          <select
            className={css}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((row) => (
              <option value={row.id} key={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <select
            className={css}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className={css}
            value={foodType}
            onChange={(event) => setFoodType(event.target.value)}
          >
            <option value="">All Food Type</option>
            <option value="veg">Veg</option>
            <option value="non-veg">Non-Veg</option>
            <option value="egg">Egg</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id} className="border-t border-slate-800">
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">
                    <button
                      className="flex items-center gap-3 text-left"
                      onClick={() => {
                        setEditing({ ...blank, ...item });
                        setTab(tabs[0]);
                      }}
                    >
                      {item.image?.startsWith("data:image/") ||
                      item.image?.startsWith("http") ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-800">
                          Food
                        </span>
                      )}
                      <span>
                        <b>{item.name}</b>
                        <small className="block text-xs text-slate-500">
                          {item.subCategory || item.shortDescription}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td className="p-4 text-slate-400">{item.category}</td>
                  <td className="p-4">Rs. {item.price}</td>
                  <td className="p-4">
                    <button
                      onClick={async () => {
                        const saved = await updateMenuItem(item.id, {
                          isAvailable: !item.isAvailable,
                        });
                        setItems((current) =>
                          current.map((row) =>
                            row.id === saved.id ? saved : row,
                          ),
                        );
                      }}
                      className={
                        item.isAvailable ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      {item.isAvailable ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing({ ...blank, ...item });
                          setTab(tabs[0]);
                        }}
                        className="rounded-lg border border-slate-700 p-2"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="rounded-lg border border-slate-700 p-2 text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="p-12 text-center text-sm text-slate-500">
              No menu items found.
            </p>
          )}
        </div>
      </div>
      {editing && (
        <Editor
          item={editing}
          tab={tab}
          setTab={setTab}
          patch={patch}
          categories={categories}
          groups={groups}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </main>
  );
}

function Editor({
  item,
  tab,
  setTab,
  patch,
  categories,
  groups,
  onClose,
  onSave,
}) {
  const imageChange = (event) => {
    const files = [...event.target.files];
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((images) => patch({ images, image: images[0] || "" }));
  };
  const setChannel = (key, value) =>
    patch({
      availabilityChannels: { ...item.availabilityChannels, [key]: value },
    });
  const final =
    Number(item.price || 0) +
    (item.gstMode === "percentage"
      ? (Number(item.price || 0) * Number(item.gst || 0)) / 100
      : Number(item.gst || 0)) +
    Number(item.charges || 0);
  return (
    <div className="fixed inset-0 z-50 bg-black/70">
      <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-slate-800 bg-[#07131f] p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {item.id ? "Edit Menu Item" : "Add Menu Item"}
            </h2>
            <p className="text-xs text-slate-500">
              Save all tabs together to the food item.
            </p>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-800">
          {tabs.map((entry) => (
            <button
              key={entry}
              onClick={() => setTab(entry)}
              className={`border-b-2 px-3 py-3 text-xs whitespace-nowrap ${tab === entry ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-500"}`}
            >
              {entry}
            </button>
          ))}
        </div>
        {tab === "Basic Info" && (
          <div className="space-y-4">
            <Section title="Basic Information">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Item Name *">
                  <input
                    className={css}
                    value={item.name}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <select
                    className={css}
                    value={item.categoryId || ""}
                    onChange={(e) => {
                      const row = categories.find(
                        (category) => category.id === e.target.value,
                      );
                      patch({
                        categoryId: e.target.value || null,
                        category: row?.name || "",
                      });
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories.map((row) => (
                      <option value={row.id} key={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sub Category">
                  <input
                    className={css}
                    value={item.subCategory || ""}
                    onChange={(e) => patch({ subCategory: e.target.value })}
                  />
                </Field>
                <Field label="Short Description">
                  <input
                    className={css}
                    value={item.shortDescription || ""}
                    onChange={(e) =>
                      patch({ shortDescription: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Detailed Description">
                <textarea
                  className={css}
                  rows={4}
                  value={item.description || ""}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </Field>
              <Field label="Food Type">
                <div className="flex gap-2">
                  {["veg", "non-veg", "egg"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() =>
                        patch({ foodType: type, isVeg: type === "veg" })
                      }
                      className={`flex-1 rounded-lg border p-2 text-xs ${item.foodType === type ? "border-emerald-400 text-emerald-400" : "border-slate-700"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tags">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["isChefSpecial", "Chef's Special"],
                    ["isBestseller", "Bestseller"],
                    ["isNewItem", "New Item"],
                    ["isSpicy", "Spicy Item"],
                  ].map(([key, label]) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={key}
                    >
                      <input
                        type="checkbox"
                        checked={!!item[key]}
                        onChange={(e) => patch({ [key]: e.target.checked })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Item Images">
                <input
                  className={css}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={imageChange}
                />
              </Field>
            </Section>
          </div>
        )}
        {tab === "Pricing & Tax" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Pricing & Taxes">
              <Field label="Base Price (Rs.)">
                <input
                  className={css}
                  type="number"
                  value={item.price}
                  onChange={(e) => patch({ price: Number(e.target.value) })}
                />
              </Field>
              <Field label="GST Mode">
                <select
                  className={css}
                  value={item.gstMode}
                  onChange={(e) => patch({ gstMode: e.target.value })}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="none">No GST</option>
                </select>
              </Field>
              <Field label="GST (%)">
                <input
                  className={css}
                  type="number"
                  value={item.gst}
                  onChange={(e) => patch({ gst: Number(e.target.value) })}
                />
              </Field>
              <Field label="Additional Charges (Rs.)">
                <input
                  className={css}
                  type="number"
                  value={item.charges}
                  onChange={(e) => patch({ charges: Number(e.target.value) })}
                />
              </Field>
            </Section>
            <Section title="Final Selling Price">
              <p className="text-3xl font-bold text-emerald-400">
                Rs.{final.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Base + GST + charges
              </p>
            </Section>
          </div>
        )}
        {tab === "Inventory" && (
          <Section title="Inventory">
            <div className="mb-4 flex justify-between text-sm">
              Track Inventory{" "}
              <Toggle
                checked={item.trackInventory}
                onChange={(value) => patch({ trackInventory: value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Current Stock">
                <input
                  className={css}
                  type="number"
                  value={item.stock}
                  onChange={(e) => patch({ stock: Number(e.target.value) })}
                />
              </Field>
              <Field label="Minimum Stock">
                <input
                  className={css}
                  type="number"
                  value={item.minStock}
                  onChange={(e) => patch({ minStock: Number(e.target.value) })}
                />
              </Field>
              <Field label="Maximum Stock">
                <input
                  className={css}
                  type="number"
                  value={item.maxStock}
                  onChange={(e) => patch({ maxStock: Number(e.target.value) })}
                />
              </Field>
            </div>
            <button
              disabled
              className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-xs"
            >
              Recipe (BOM)
            </button>
          </Section>
        )}
        {tab === "Modifiers" && (
          <Section title="Modifiers / Add-ons">
            <div className="space-y-2">
              {groups.map((group) => (
                <label
                  className="flex items-center gap-3 rounded-lg border border-slate-800 p-3 text-sm"
                  key={group.id}
                >
                  <input
                    type="checkbox"
                    checked={item.modifierGroupIds?.includes(group.id)}
                    onChange={(e) =>
                      patch({
                        modifierGroupIds: e.target.checked
                          ? [...(item.modifierGroupIds || []), group.id]
                          : (item.modifierGroupIds || []).filter(
                              (id) => id !== group.id,
                            ),
                      })
                    }
                  />
                  {group.name}
                  <span className="ml-auto text-xs text-slate-500">
                    {group.options?.length || 0} options
                  </span>
                </label>
              ))}
            </div>
            <a
              href="/menu/add-ons"
              className="mt-4 inline-block text-sm text-emerald-400"
            >
              + Add Modifier Group
            </a>
          </Section>
        )}
        {tab === "Availability" && (
          <Section title="Availability">
            <div className="grid gap-2 sm:grid-cols-2">
              {channels.map(([key, label]) => (
                <label
                  className="flex items-center gap-2 rounded-lg border border-slate-800 p-3 text-sm"
                  key={key}
                >
                  <input
                    type="checkbox"
                    checked={item.availabilityChannels?.[key]}
                    onChange={(e) => setChannel(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Kitchen Station">
                <input
                  className={css}
                  value={item.kitchenStation}
                  onChange={(e) => patch({ kitchenStation: e.target.value })}
                />
              </Field>
              <Field label="Preparation Time (minutes)">
                <input
                  className={css}
                  type="number"
                  value={item.prepTimeMinutes}
                  onChange={(e) =>
                    patch({ prepTimeMinutes: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
          </Section>
        )}
        {tab === "Other Settings" && (
          <Section title="Other Settings">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.isAvailable}
                onChange={(e) => patch({ isAvailable: e.target.checked })}
              />{" "}
              Active and available
            </label>
          </Section>
        )}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-5 py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="rounded-lg bg-emerald-400 px-5 py-2.5 font-bold text-slate-950"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
