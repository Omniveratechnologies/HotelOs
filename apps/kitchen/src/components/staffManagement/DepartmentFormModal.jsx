import { useEffect, useState } from "react";
import { FiPlus, FiSave } from "react-icons/fi";

import Modal from "../ui/Modal.jsx";
import ActionButton from "../ui/button/ActionButton.jsx";
import DepartmentIcon from "./DepartmentIcon.jsx";
import {
  DEFAULT_COLOR,
  DEFAULT_ICON,
  DEPARTMENT_COLORS,
  DEPARTMENT_ICONS,
  suggestCode,
} from "../../utils/departmentOptions.js";

const EMPTY = {
  name: "",
  code: "",
  description: "",
  status: "ACTIVE",
  icon: DEFAULT_ICON,
  color: DEFAULT_COLOR,
};

const inputClass =
  "w-full rounded-lg border bg-[#0f0f0f] px-3 py-2.5 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-600";

const validate = (values) => {
  const errors = {};
  const name = values.name.trim();

  if (name.length < 2 || name.length > 80)
    errors.name = "Enter a name (2-80 characters).";
  if (!/^[A-Za-z0-9]{2,6}$/.test(values.code.trim()))
    errors.code = "2-6 letters or digits, e.g. FO.";
  if (values.description.length > 300)
    errors.description = "At most 300 characters.";

  return errors;
};

const DepartmentFormModal = ({
  open,
  mode = "create",
  department,
  onClose,
  onSubmit,
}) => {
  const isEdit = mode === "edit";

  const [values, setValues] = useState(EMPTY);
  const [codeTouched, setCodeTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setValues(
      isEdit && department
        ? {
            name: department.name || "",
            code: department.code || "",
            description: department.description || "",
            status: department.isActive ? "ACTIVE" : "INACTIVE",
            icon: department.icon || DEFAULT_ICON,
            color: department.color || DEFAULT_COLOR,
          }
        : EMPTY,
    );
    setCodeTouched(isEdit);
    setErrors({});
    setFormError("");
    setSaving(false);
  }, [open, isEdit, department]);

  const change = (key, value) => {
    setValues((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "name" && !codeTouched) next.code = suggestCode(value);
      return next;
    });
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const found = validate(values);
    setErrors(found);
    setFormError("");

    if (Object.keys(found).length > 0) return;

    setSaving(true);

    try {
      await onSubmit({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description.trim(),
        status: values.status,
        icon: values.icon,
        color: values.color,
      });
    } catch (error) {
      setFormError(error.message || "Could not save the department.");
      setSaving(false);
    }
  };

  const fieldBorder = (key) =>
    errors[key] ? "border-red-500/60" : "border-gray-700";

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? "Edit Department" : "Add Department"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300"
          >
            {formError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="dept-name"
              className="mb-1.5 block text-xs font-medium text-gray-300"
            >
              Department Name <span className="text-red-400">*</span>
            </label>
            <input
              id="dept-name"
              value={values.name}
              onChange={(event) => change("name", event.target.value)}
              placeholder="Enter department name"
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              className={`${inputClass} ${fieldBorder("name")}`}
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="dept-code"
              className="mb-1.5 block text-xs font-medium text-gray-300"
            >
              Department Code <span className="text-red-400">*</span>
            </label>
            <input
              id="dept-code"
              value={values.code}
              onChange={(event) => {
                setCodeTouched(true);
                change("code", event.target.value.toUpperCase());
              }}
              placeholder="Enter code (e.g. FO)"
              maxLength={6}
              aria-invalid={Boolean(errors.code)}
              className={`${inputClass} ${fieldBorder("code")}`}
            />
            {errors.code ? (
              <p className="mt-1 text-[11px] text-red-400">{errors.code}</p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500">
                Must be unique in your hotel.
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="dept-description"
            className="mb-1.5 block text-xs font-medium text-gray-300"
          >
            Description <span className="text-gray-500">(Optional)</span>
          </label>
          <textarea
            id="dept-description"
            value={values.description}
            onChange={(event) => change("description", event.target.value)}
            placeholder="Enter department description..."
            rows={3}
            maxLength={300}
            className={`${inputClass} resize-none ${fieldBorder("description")}`}
          />
          <p className="mt-1 text-right text-[11px] text-gray-500">
            {values.description.length}/300
          </p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-gray-300">
            Status <span className="text-red-400">*</span>
          </legend>
          <div className="flex gap-6">
            {[
              ["ACTIVE", "Active"],
              ["INACTIVE", "Inactive"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-xs text-gray-300"
              >
                <input
                  type="radio"
                  name="dept-status"
                  value={value}
                  checked={values.status === value}
                  onChange={() => change("status", value)}
                  className="h-4 w-4 accent-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-gray-300">
            Icon
          </legend>
          <div
            role="radiogroup"
            aria-label="Department icon"
            className="flex flex-wrap gap-2"
          >
            {Object.entries(DEPARTMENT_ICONS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={values.icon === key}
                aria-label={label}
                title={label}
                onClick={() => change("icon", key)}
                className={`rounded-lg border p-1 transition ${
                  values.icon === key
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 hover:bg-gray-800"
                }`}
              >
                <DepartmentIcon
                  icon={key}
                  color={values.color}
                  boxClass="h-7 w-7"
                  size={15}
                />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-gray-300">
            Colour
          </legend>
          <div
            role="radiogroup"
            aria-label="Department colour"
            className="flex flex-wrap gap-2"
          >
            {DEPARTMENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={values.color === color}
                aria-label={`Colour ${color}`}
                onClick={() => change("color", color)}
                style={{ backgroundColor: color }}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  values.color === color
                    ? "border-white"
                    : "border-transparent hover:scale-110"
                }`}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-2 border-t border-gray-800 pt-4">
          <ActionButton variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            icon={isEdit ? <FiSave size={14} /> : <FiPlus size={14} />}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Department"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentFormModal;
