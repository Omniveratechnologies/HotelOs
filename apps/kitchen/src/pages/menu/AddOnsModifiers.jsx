/* oxlint-disable react/set-state-in-effect */
import { useEffect, useState } from "react";
import { Edit3, GripVertical, Plus, Trash2, X } from "lucide-react";
import {
  getModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
} from "../../services/menuManagement.js";
const css =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const empty = {
  name: "",
  type: "single",
  description: "",
  image: "",
  displayOrder: 1,
  status: true,
  required: false,
  minSelection: 0,
  maxSelection: 1,
  allowMultiple: false,
  options: [],
};
export default function AddOnsModifiers() {
  const [rows, setRows] = useState([]),
    [editing, setEditing] = useState(null),
    [tab, setTab] = useState("Group Details"),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setRows(await getModifierGroups());
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      const saved = editing.id
        ? await updateModifierGroup(editing.id, editing)
        : await createModifierGroup(editing);
      setRows((current) =>
        editing.id
          ? current.map((row) => (row.id === saved.id ? saved : row))
          : [...current, saved],
      );
      setEditing(null);
    } catch (e) {
      setError(e.message);
    }
  };
  const remove = async (id) => {
    await deleteModifierGroup(id);
    setRows((current) => current.filter((row) => row.id !== id));
  };
  const toggle = async (row) => {
    const saved = await updateModifierGroup(row.id, { status: !row.status });
    setRows((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
  };
  return (
    <main className="min-h-full bg-[#07131f] p-4 text-slate-100 md:p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[.22em] text-emerald-400 uppercase">
            Menu Management
          </p>
          <h1 className="text-2xl font-bold">Add-ons / Modifiers</h1>
          <p className="text-sm text-slate-400">
            Create and manage modifier groups and options.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ ...empty, displayOrder: rows.length + 1 });
            setTab("Group Details");
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 font-bold text-slate-950"
        >
          <Plus size={16} /> Add Modifier Group
        </button>
      </div>
      {error && <Notice text={error} />}
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
            key={row.id}
          >
            <GripVertical className="text-slate-600" size={16} />
            <div className="flex-1">
              <b>{row.name}</b>
              <p className="text-xs text-slate-500">
                {row.options?.length || 0} options
              </p>
            </div>
            <span className="rounded bg-blue-500/15 px-2 py-1 text-xs">
              {row.type === "multi" ? "Multi Select" : "Single Select"}
            </span>
            <span className="text-xs text-emerald-400">
              {row.required ? "Required" : "Optional"}
            </span>
            <button
              onClick={() => toggle(row)}
              className={row.status ? "text-emerald-400" : "text-slate-500"}
            >
              {row.status ? "Active" : "Inactive"}
            </button>
            <button
              onClick={() => {
                setEditing({ ...row });
                setTab("Group Details");
              }}
            >
              <Edit3 size={15} />
            </button>
            <button onClick={() => remove(row.id)} className="text-red-400">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      {editing && (
        <Editor
          value={editing}
          setValue={setEditing}
          tab={tab}
          setTab={setTab}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </main>
  );
}
function Editor({ value, setValue, tab, setTab, onClose, onSave }) {
  const patch = (key, val) => setValue({ ...value, [key]: val });
  const addOption = () =>
    patch("options", [
      ...value.options,
      {
        name: "New Option",
        image: "",
        price: 0,
        isDefault: false,
        status: true,
      },
    ]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70">
      <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-[#07131f] p-5">
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">Add / Edit Modifier Group</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="my-5 flex gap-1 border-b border-slate-800">
          {["Group Details", "Modifier Options", "Settings"].map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`border-b-2 px-3 py-3 text-xs ${tab === name ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-500"}`}
            >
              {name}
            </button>
          ))}
        </div>
        {tab === "Group Details" && (
          <div className="space-y-4">
            <Field label="Group Name">
              <input
                className={css}
                value={value.name}
                onChange={(e) => patch("name", e.target.value)}
              />
            </Field>
            <Field label="Group Type">
              <select
                className={css}
                value={value.type}
                onChange={(e) => patch("type", e.target.value)}
              >
                <option value="single">Single Select (Radio)</option>
                <option value="multi">Multi Select (Checkbox)</option>
              </select>
            </Field>
            <Field label="Description">
              <textarea
                className={css}
                value={value.description}
                onChange={(e) => patch("description", e.target.value)}
              />
            </Field>
            <Field label="Display Order">
              <input
                className={css}
                type="number"
                value={value.displayOrder}
                onChange={(e) => patch("displayOrder", Number(e.target.value))}
              />
            </Field>
          </div>
        )}
        {tab === "Modifier Options" && (
          <div>
            <button
              onClick={addOption}
              className="mb-3 rounded bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
            >
              + Add Option
            </button>
            {value.options.map((option, index) => (
              <div
                className="mb-2 grid grid-cols-[1fr_100px_auto] gap-2"
                key={index}
              >
                <input
                  className={css}
                  value={option.name}
                  onChange={(e) => {
                    const options = [...value.options];
                    options[index] = { ...option, name: e.target.value };
                    patch("options", options);
                  }}
                />
                <input
                  className={css}
                  type="number"
                  value={option.price}
                  onChange={(e) => {
                    const options = [...value.options];
                    options[index] = {
                      ...option,
                      price: Number(e.target.value),
                    };
                    patch("options", options);
                  }}
                />
                <button
                  onClick={() =>
                    patch(
                      "options",
                      value.options.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                  className="text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        {tab === "Settings" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.required}
                onChange={(e) => patch("required", e.target.checked)}
              />
              {value.required ? "Yes (Customer must select)" : "Optional"}
            </label>
            <Field label="Minimum Selection">
              <input
                className={css}
                type="number"
                value={value.minSelection}
                onChange={(e) => patch("minSelection", Number(e.target.value))}
              />
            </Field>
            <Field label="Maximum Selection">
              <input
                className={css}
                type="number"
                value={value.maxSelection}
                onChange={(e) => patch("maxSelection", Number(e.target.value))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.allowMultiple}
                onChange={(e) => patch("allowMultiple", e.target.checked)}
              />{" "}
              Allow Multiple Selections
            </label>
          </div>
        )}
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
        className="rounded border border-slate-700 px-4 py-2"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="rounded bg-emerald-400 px-4 py-2 font-bold text-slate-950"
      >
        Save Modifier Group
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
