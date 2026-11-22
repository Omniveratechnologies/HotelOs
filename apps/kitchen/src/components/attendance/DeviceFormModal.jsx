import { useEffect, useState } from "react";

import Modal from "../ui/Modal";
import ActionButton from "../ui/button/ActionButton";
import { TYPE_OPTIONS } from "../../utils/deviceFormat.js";

const EMPTY = {
  name: "",
  deviceCode: "",
  type: "FACE_RECOGNITION",
  location: "",
  ipAddress: "",
  configText: "{}",
};

const inputClass =
  "w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500";

const Field = ({ label, hint, children }) => (
  <label className="block text-xs text-gray-400">
    <span className="mb-1.5 block font-medium text-gray-300">{label}</span>
    {children}
    {hint && (
      <span className="mt-1 block text-[10px] text-gray-500">{hint}</span>
    )}
  </label>
);

const DeviceFormModal = ({ open, device, onClose, onSubmit }) => {
  const editing = Boolean(device);
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    setValues(
      device
        ? {
            name: device.name,
            deviceCode: device.deviceCode,
            type: device.type,
            location: device.location,
            ipAddress: device.ipAddress || "",
            configText: JSON.stringify(device.config || {}, null, 2),
          }
        : EMPTY,
    );
  }, [open, device]);

  const set = (name) => (event) =>
    setValues((previous) => ({ ...previous, [name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();

    let config;
    try {
      config = values.configText.trim() ? JSON.parse(values.configText) : {};
      if (!config || typeof config !== "object" || Array.isArray(config))
        throw new Error();
    } catch {
      setError('Settings must be a JSON object, for example {"volume": 7}.');
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: values.name,
        type: values.type,
        location: values.location,
        ipAddress: values.ipAddress,
        config,
        ...(values.deviceCode.trim() ? { deviceCode: values.deviceCode } : {}),
      });
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={editing ? `Edit ${device.name}` : "Add Device"}
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            onClick={() =>
              document.getElementById("device-form")?.requestSubmit()
            }
            disabled={saving}
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Device"}
          </ActionButton>
        </>
      }
    >
      <form id="device-form" onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 text-xs text-red-300"
          >
            {error}
          </p>
        )}

        <Field label="Device Name">
          <input
            value={values.name}
            onChange={set("name")}
            placeholder="Front Desk Kiosk"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Device Type">
            <select
              value={values.type}
              onChange={set("type")}
              className={inputClass}
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input
              value={values.location}
              onChange={set("location")}
              placeholder="Main Lobby"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Device ID"
            hint={editing ? "" : "Leave empty to generate one (ADV-FD-001)"}
          >
            <input
              value={values.deviceCode}
              onChange={set("deviceCode")}
              placeholder="ADV-FD-001"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="IP Address">
            <input
              value={values.ipAddress}
              onChange={set("ipAddress")}
              placeholder="192.168.1.10"
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Settings (JSON)"
          hint="Sent to the device as its configuration."
        >
          <textarea
            value={values.configText}
            onChange={set("configText")}
            rows={4}
            spellCheck={false}
            className={`${inputClass} font-mono text-xs`}
          />
        </Field>
      </form>
    </Modal>
  );
};

export default DeviceFormModal;
