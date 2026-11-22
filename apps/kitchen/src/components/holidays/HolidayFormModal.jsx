import { useEffect, useState } from "react";

import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import {
  inputCls,
  labelCls,
  localToday,
  post,
  put,
  request,
} from "../../utils/holidayUtils.js";

const Field = ({ label, children, hint }) => (
  <label className="block space-y-1.5">
    <span className={labelCls}>{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-gray-500">{hint}</span>}
  </label>
);

const Check = ({ checked, onChange, children, hint, label }) => (
  <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-300">
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 accent-emerald-500"
    />
    <span>
      {children}
      {hint && <span className="block text-[10px] text-gray-500">{hint}</span>}
    </span>
  </label>
);

const HolidayFormModal = ({ holiday, defaultDate, onClose, onSaved }) => {
  const editing = Boolean(holiday);
  const today = localToday();
  const passed = editing && holiday.date < today;

  const [form, setForm] = useState(() => ({
    name: holiday?.name ?? "",
    date: holiday?.date ?? defaultDate ?? "",
    type: holiday?.type ?? "CUSTOM",
    description: holiday?.description ?? "",
    isRecurring: holiday?.isRecurring ?? false,
    holidayDuty: holiday?.holidayDuty ?? false,
    scope: holiday && !holiday.appliesToAll ? "SELECTED" : "ALL",
    departmentIds: holiday?.departments?.map((d) => d._id) ?? [],
    applyToSeries: true,
  }));
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request("/staffManagement/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);

  const set = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));
  const toggleDepartment = (id) =>
    setForm((f) => ({
      ...f,
      departmentIds: f.departmentIds.includes(id)
        ? f.departmentIds.filter((x) => x !== id)
        : [...f.departmentIds, id],
    }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2)
      return setError("Enter the holiday name (at least 2 characters).");
    if (!form.date) return setError("Choose the holiday date.");
    if (
      form.type === "CUSTOM" &&
      form.scope === "SELECTED" &&
      form.departmentIds.length === 0
    )
      return setError(
        "Pick at least one department, or choose the whole hotel.",
      );

    const body = {
      name: form.name.trim(),
      date: form.date,
      type: form.type,
      description: form.description.trim(),
      isRecurring: form.isRecurring,
      holidayDuty: form.holidayDuty,
      departmentIds:
        form.type === "CUSTOM" && form.scope === "SELECTED"
          ? form.departmentIds
          : [],
    };

    setSaving(true);
    try {
      if (editing)
        await put(`/${holiday._id}`, {
          ...body,
          applyToSeries: holiday.isRecurring ? form.applyToSeries : undefined,
        });
      else await post("/", body);
      onSaved(editing ? "Holiday updated" : "Holiday added");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      title={editing ? "Edit Holiday" : "Add Holiday"}
      maxWidth="max-w-lg"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add Holiday"}
          </ActionButton>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Holiday name">
          <input
            aria-label="Holiday name"
            value={form.name}
            onChange={set("name")}
            maxLength={60}
            placeholder="Diwali"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Date"
            hint={
              passed
                ? "This holiday has already passed, so its date is locked."
                : undefined
            }
          >
            <input
              aria-label="Date"
              type="date"
              value={form.date}
              onChange={set("date")}
              disabled={passed}
              min={editing ? undefined : undefined}
              className={inputCls}
            />
          </Field>
          <fieldset className="space-y-1.5">
            <legend className={labelCls}>Type</legend>
            <div className="flex gap-2">
              {[
                ["NATIONAL", "National"],
                ["CUSTOM", "Custom"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs transition ${form.type === value ? "border-emerald-400 bg-emerald-950/40 text-white" : "border-gray-700 text-gray-400 hover:bg-[#1a1a1a]"}`}
                >
                  <input
                    type="radio"
                    name="holiday-type"
                    value={value}
                    checked={form.type === value}
                    onChange={set("type")}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <Field label="Description (optional)">
          <textarea
            aria-label="Description"
            rows={2}
            maxLength={200}
            value={form.description}
            onChange={set("description")}
            placeholder="Festival of lights"
            className={`${inputCls} resize-none`}
          />
        </Field>

        {form.type === "CUSTOM" && (
          <fieldset className="space-y-2">
            <legend className={labelCls}>Who gets the day off</legend>
            <div className="flex gap-4 text-xs text-gray-300">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  checked={form.scope === "ALL"}
                  onChange={() => setForm((f) => ({ ...f, scope: "ALL" }))}
                  className="accent-emerald-500"
                />{" "}
                Whole hotel
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  checked={form.scope === "SELECTED"}
                  onChange={() => setForm((f) => ({ ...f, scope: "SELECTED" }))}
                  className="accent-emerald-500"
                />{" "}
                Selected departments
              </label>
            </div>
            {form.scope === "SELECTED" && (
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Departments"
              >
                {departments.map((department) => {
                  const on = form.departmentIds.includes(department._id);
                  return (
                    <button
                      key={department._id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDepartment(department._id)}
                      className={`rounded-full border px-3 py-1 text-[11px] transition ${on ? "border-emerald-400 bg-emerald-950/40 text-white" : "border-gray-700 text-gray-400 hover:bg-[#1a1a1a]"}`}
                    >
                      {department.name}
                    </button>
                  );
                })}
                {departments.length === 0 && (
                  <span className="text-[11px] text-gray-500">
                    No departments found.
                  </span>
                )}
              </div>
            )}
          </fieldset>
        )}

        <div className="space-y-2.5">
          <Check
            label="Repeat every year"
            checked={form.isRecurring}
            onChange={(v) => setForm((f) => ({ ...f, isRecurring: v }))}
            hint="Added to the calendar for the next 5 years."
          >
            Repeat every year
          </Check>
          <Check
            label="Holiday duty"
            checked={form.holidayDuty}
            onChange={(v) => setForm((f) => ({ ...f, holidayDuty: v }))}
            hint="The hotel is closed but these staff still have to work, so they are not marked on holiday."
          >
            Holiday duty (staff still work)
          </Check>
          {editing && holiday.isRecurring && (
            <Check
              label="Apply to later years"
              checked={form.applyToSeries}
              onChange={(v) => setForm((f) => ({ ...f, applyToSeries: v }))}
              hint="Name, type, description and departments change in every later year too."
            >
              Apply to all later years
            </Check>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-950 px-3 py-2 text-xs text-red-200"
          >
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};

export default HolidayFormModal;
