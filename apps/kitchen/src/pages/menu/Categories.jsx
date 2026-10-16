import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  GripVertical,
  Plus,
  Trash2,
  X,
  Utensils,
  ChefHat,
  Coffee,
  Croissant,
  IceCream,
  CupSoda,
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/menuManagement.js";
const css =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const icons = [
  "utensils",
  "chef-hat",
  "coffee",
  "croissant",
  "ice-cream",
  "cup-soda",
];
const iconMap = {
  utensils: Utensils,
  "chef-hat": ChefHat,
  coffee: Coffee,
  croissant: Croissant,
  "ice-cream": IceCream,
  "cup-soda": CupSoda,
};
function CategoryIcon({ icon, size = 16 }) {
  const Icon = iconMap[icon] || Utensils;
  return <Icon size={size} />;
}
export default function Categories() {
  const [rows, setRows] = useState([]),
    [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setRows(await getCategories());
    } catch (e) {
      setError(e.message);
    }
  };
  // oxlint-disable react/set-state-in-effect
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    load();
  }, []);
  // oxlint-enable react/set-state-in-effect
  const save = async () => {
    try {
      const saved = editing.id
        ? await updateCategory(editing.id, editing)
        : await createCategory(editing);
      setRows((current) =>
        editing.id
          ? current.map((row) => (row.id === saved.id ? saved : row))
          : [...current, saved],
      );
      setEditing(null);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const children = useMemo(
    () => (id) => rows.filter((row) => row.parentCategory === id).length,
    [rows],
  );
  const remove = async (id) => {
    try {
      await deleteCategory(id);
      setRows((current) => current.filter((row) => row.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="min-h-full bg-[#07131f] p-4 text-slate-100 md:p-6">
      <Header
        onAdd={() =>
          setEditing({
            name: "",
            description: "",
            // Must be null, not "" — an empty string fails Mongoose's
            // ObjectId cast on save if the parent dropdown is never touched.
            parentCategory: null,
            image: "",
            icon: icons[0],
            displayOrder: rows.length + 1,
            status: "active",
          })
        }
      />
      {error && <Notice text={error} />}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Name</th>
              <th className="p-4">Sub Categories</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-t border-slate-800" key={row.id}>
                <td className="flex items-center gap-2 p-4">
                  <GripVertical size={16} />
                  {index + 1}
                </td>
                <td className="p-4">
                  <b className="flex items-center gap-2">
                    <CategoryIcon icon={row.icon} /> {row.name}
                  </b>
                  <p className="text-xs text-slate-500">{row.description}</p>
                </td>
                <td className="p-4 text-slate-400">
                  {children(row.id)} sub categories
                </td>
                <td className="p-4">
                  <span
                    className={
                      row.status === "active"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setEditing({ ...row })}
                    className="mr-2 rounded border border-slate-700 p-2"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => remove(row.id)}
                    className="rounded border border-slate-700 p-2 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-sm text-slate-500"
                >
                  No categories yet. Click "Add Category" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <Editor
          value={editing}
          setValue={setEditing}
          rows={rows}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </main>
  );
}
function Header({ onAdd }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <p className="text-xs tracking-[.22em] text-emerald-400 uppercase">
          Menu Management
        </p>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-slate-400">
          Organize your menu structure with categories and sub-categories.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 font-bold text-slate-950"
      >
        <Plus size={16} /> Add Category
      </button>
    </div>
  );
}
function Editor({ value, setValue, rows, onClose, onSave }) {
  const patch = (key, val) => setValue({ ...value, [key]: val });
  return (
    <div className="fixed inset-0 z-50 bg-black/70">
      <div className="ml-auto h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-[#07131f] p-5">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold">
            {value.id ? "Edit" : "Add"} Category
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Category Name">
            <input
              className={css}
              value={value.name}
              onChange={(e) => patch("name", e.target.value)}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={css}
              value={value.description}
              onChange={(e) => patch("description", e.target.value)}
            />
          </Field>
          <Field label="Parent Category">
            <select
              className={css}
              value={value.parentCategory || ""}
              onChange={(e) => patch("parentCategory", e.target.value || null)}
            >
              <option value="">None (Main Category)</option>
              {rows
                .filter((row) => row.id !== value.id)
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Icon">
            <div className="grid grid-cols-6 gap-2">
              {icons.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => patch("icon", icon)}
                  className={`flex items-center justify-center rounded border p-2 ${value.icon === icon ? "border-emerald-400 text-emerald-400" : "border-slate-700 text-slate-400"}`}
                >
                  <CategoryIcon icon={icon} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Display Order">
            <input
              className={css}
              type="number"
              value={value.displayOrder}
              onChange={(e) => patch("displayOrder", Number(e.target.value))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.status === "active"}
              onChange={(e) =>
                patch("status", e.target.checked ? "active" : "inactive")
              }
            />{" "}
            Active
          </label>
        </div>
        <Actions onClose={onClose} onSave={onSave} />
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block text-xs text-slate-400">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function Actions({ onClose, onSave }) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4">
      <button
        onClick={onClose}
        className="rounded-lg border border-slate-700 px-4 py-2"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="rounded-lg bg-emerald-400 px-4 py-2 font-bold text-slate-950"
      >
        Save Category
      </button>
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
