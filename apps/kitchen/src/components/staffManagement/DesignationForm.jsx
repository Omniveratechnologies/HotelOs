import { useEffect, useRef, useState } from "react";
import { FiPlus, FiSave } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton";

export const suggestDesignationCode = (name = "") => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length > 1)
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 6);
  return words[0].length <= 4 ? words[0] : words[0].slice(0, 3);
};

const inputClass =
  "w-full rounded-lg border bg-[#0f0f0f] px-3 py-2.5 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-600 disabled:opacity-50";

const validate = (values) => {
  const errors = {};

  if (values.name.trim().length < 2 || values.name.trim().length > 80)
    errors.name = "Enter a name (2-80 characters).";
  if (!values.departmentId) errors.departmentId = "Select a department.";
  if (!/^[A-Za-z0-9]{2,8}$/.test(values.code.trim()))
    errors.code = "2-8 letters or digits, e.g. REC.";
  if (values.description.length > 300)
    errors.description = "At most 300 characters.";

  return errors;
};

const DesignationForm = ({
  mode = "create",
  designation,
  departments = [],
  onSubmit,
  onCancel,
  focusToken = 0,
}) => {
  const isEdit = mode === "edit";

  const [values, setValues] = useState(() => ({
    name: isEdit ? designation?.name || "" : "",
    departmentId: isEdit ? String(designation?.departmentId || "") : "",
    code: isEdit ? designation?.code || "" : "",
    description: isEdit ? designation?.description || "" : "",
    status: isEdit && !designation?.isActive ? "INACTIVE" : "ACTIVE",
  }));
  const [codeTouched, setCodeTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (focusToken > 0) nameRef.current?.focus();
  }, [focusToken]);

  const change = (key, value) => {
    setValues((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "name" && !codeTouched)
        next.code = suggestDesignationCode(value);
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
        departmentId: values.departmentId,
        code: values.code.trim().toUpperCase(),
        description: values.description.trim(),
        status: values.status,
      });
    } catch (error) {
      setFormError(error.message || "Could not save the designation.");
    } finally {
      setSaving(false);
    }
  };

  const border = (key) =>
    errors[key] ? "border-red-500/60" : "border-gray-700";

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300"
        >
          {formError}
        </p>
      )}

      <div>
        <label
          htmlFor="desig-name"
          className="mb-1.5 block text-xs font-medium text-gray-300"
        >
          Designation Name <span className="text-red-400">*</span>
        </label>
        <input
          id="desig-name"
          ref={nameRef}
          value={values.name}
          onChange={(event) => change("name", event.target.value)}
          placeholder="Enter designation name"
          maxLength={80}
          aria-invalid={Boolean(errors.name)}
          className={`${inputClass} ${border("name")}`}
        />
        {errors.name ? (
          <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>
        ) : (
          <p className="mt-1 text-[11px] text-gray-500">
            e.g. Receptionist, Chef, Housekeeping Supervisor
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="desig-department"
          className="mb-1.5 block text-xs font-medium text-gray-300"
        >
          Department <span className="text-red-400">*</span>
        </label>
        <select
          id="desig-department"
          value={values.departmentId}
          onChange={(event) => change("departmentId", event.target.value)}
          aria-invalid={Boolean(errors.departmentId)}
          className={`${inputClass} ${border("departmentId")}`}
        >
          <option value="">Select department</option>
          {departments.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.departmentId && (
          <p className="mt-1 text-[11px] text-red-400">{errors.departmentId}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="desig-code"
          className="mb-1.5 block text-xs font-medium text-gray-300"
        >
          Designation Code <span className="text-red-400">*</span>
        </label>
        <input
          id="desig-code"
          value={values.code}
          onChange={(event) => {
            setCodeTouched(true);
            change("code", event.target.value.toUpperCase());
          }}
          placeholder="Enter code (e.g. REC, CHEF)"
          maxLength={8}
          aria-invalid={Boolean(errors.code)}
          className={`${inputClass} ${border("code")}`}
        />
        {errors.code ? (
          <p className="mt-1 text-[11px] text-red-400">{errors.code}</p>
        ) : (
          <p className="mt-1 text-[11px] text-gray-500">
            Short code used for identification
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="desig-description"
          className="mb-1.5 block text-xs font-medium text-gray-300"
        >
          Description <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="desig-description"
          value={values.description}
          onChange={(event) => change("description", event.target.value)}
          placeholder="Enter description of this designation..."
          rows={4}
          maxLength={300}
          className={`${inputClass} resize-none ${border("description")}`}
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
                name="desig-status"
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

      <div className="flex items-center justify-between gap-2 pt-4">
        <ActionButton variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </ActionButton>
        <ActionButton
          type="submit"
          icon={isEdit ? <FiSave size={14} /> : <FiPlus size={14} />}
          disabled={saving}
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Designation"}
        </ActionButton>
      </div>
    </form>
  );
};

export default DesignationForm;
