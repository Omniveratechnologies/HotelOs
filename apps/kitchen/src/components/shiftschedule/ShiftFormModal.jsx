import { useState } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import {
  SHIFT_COLORS,
  hoursLabel,
  inputCls,
  labelCls,
  post,
  put,
  spanMinutes,
  to12h,
} from "../../utils/shiftScheduleUtils.js";

const Field = ({ label, children, hint }) => (
  <label className="block space-y-1.5">
    <span className={labelCls}>{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-gray-500">{hint}</span>}
  </label>
);

const blankSegments = () => [
  { startTime: "09:00", endTime: "13:00" },
  { startTime: "17:00", endTime: "21:00" },
];

const ShiftFormModal = ({ shift, onClose, onSaved }) => {
  const editing = Boolean(shift);
  const [form, setForm] = useState(() => ({
    name: shift?.name ?? "",
    startTime: shift?.startTime ?? "09:00",
    endTime: shift?.endTime ?? "17:00",
    split: Boolean(shift?.isSplit),
    segments: shift?.isSplit
      ? shift.segments.map((s) => ({ ...s }))
      : blankSegments(),
    breakMinutes: shift?.breakMinutes ?? 0,
    graceMinutes: shift?.graceMinutes ?? 10,
    color: shift?.color ?? SHIFT_COLORS[1],
    isActive: shift?.isActive ?? true,
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));
  const setSegment = (index, key, value) =>
    setForm((f) => ({
      ...f,
      segments: f.segments.map((s, i) =>
        i === index ? { ...s, [key]: value } : s,
      ),
    }));

  const minutes = form.split
    ? form.segments.reduce(
        (sum, s) => sum + spanMinutes(s.startTime, s.endTime),
        0,
      )
    : spanMinutes(form.startTime, form.endTime);
  const range = form.split
    ? form.segments
        .map((s) => `${to12h(s.startTime)} – ${to12h(s.endTime)}`)
        .join(" + ")
    : `${to12h(form.startTime)} – ${to12h(form.endTime)}`;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2) {
      setError("Enter a shift name (at least 2 characters).");
      return;
    }
    const body = {
      name: form.name.trim(),
      startTime: form.split ? form.segments[0].startTime : form.startTime,
      endTime: form.split
        ? form.segments[form.segments.length - 1].endTime
        : form.endTime,
      segments: form.split ? form.segments : [],
      breakMinutes: Number(form.breakMinutes) || 0,
      graceMinutes: Number(form.graceMinutes) || 0,
      color: form.color,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editing) await put(`/shifts/${shift._id}`, body);
      else await post("/shifts", body);
      onSaved(editing ? "Shift updated" : "Shift created");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      title={editing ? "Edit Shift" : "Add Shift"}
      maxWidth="max-w-lg"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add Shift"}
          </ActionButton>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Shift name">
          <input
            aria-label="Shift name"
            value={form.name}
            onChange={set("name")}
            maxLength={40}
            placeholder="Morning"
            className={inputCls}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={form.split}
            onChange={(e) =>
              setForm((f) => ({ ...f, split: e.target.checked }))
            }
            className="h-4 w-4 accent-emerald-500"
          />
          Split shift (two or more work blocks in a day)
        </label>

        {!form.split ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time">
              <input
                aria-label="Start time"
                type="time"
                value={form.startTime}
                onChange={set("startTime")}
                className={inputCls}
              />
            </Field>
            <Field
              label="End time"
              hint={
                form.endTime <= form.startTime ? "Ends the next day" : undefined
              }
            >
              <input
                aria-label="End time"
                type="time"
                value={form.endTime}
                onChange={set("endTime")}
                className={inputCls}
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-2">
            {form.segments.map((segment, index) => (
              <div key={index} className="flex items-end gap-2">
                <Field label={`Block ${index + 1} start`}>
                  <input
                    aria-label={`Block ${index + 1} start`}
                    type="time"
                    value={segment.startTime}
                    onChange={(e) =>
                      setSegment(index, "startTime", e.target.value)
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label={`Block ${index + 1} end`}>
                  <input
                    aria-label={`Block ${index + 1} end`}
                    type="time"
                    value={segment.endTime}
                    onChange={(e) =>
                      setSegment(index, "endTime", e.target.value)
                    }
                    className={inputCls}
                  />
                </Field>
                <button
                  type="button"
                  aria-label={`Remove block ${index + 1}`}
                  disabled={form.segments.length <= 2}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      segments: f.segments.filter((_, i) => i !== index),
                    }))
                  }
                  className="mb-0.5 rounded-md border border-gray-700 p-2 text-gray-400 transition hover:bg-gray-800 disabled:opacity-30"
                >
                  <FiMinus size={14} />
                </button>
              </div>
            ))}
            {form.segments.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    segments: [
                      ...f.segments,
                      { startTime: "21:00", endTime: "22:00" },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
              >
                <FiPlus size={12} /> Add block
              </button>
            )}
          </div>
        )}

        <p
          className="rounded-lg border border-gray-800 bg-[#111111] px-3 py-2 text-xs text-gray-400"
          aria-label="Shift preview"
        >
          {range} ·{" "}
          <span className="font-medium text-white">{hoursLabel(minutes)}</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Break (minutes)">
            <input
              aria-label="Break minutes"
              type="number"
              min="0"
              max="240"
              value={form.breakMinutes}
              onChange={set("breakMinutes")}
              className={inputCls}
            />
          </Field>
          <Field label="Late after (grace minutes)">
            <input
              aria-label="Grace minutes"
              type="number"
              min="0"
              max="120"
              value={form.graceMinutes}
              onChange={set("graceMinutes")}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="space-y-1.5">
          <span className={labelCls}>Colour</span>
          <div className="flex flex-wrap items-center gap-2">
            {SHIFT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Colour ${color}`}
                aria-pressed={form.color.toUpperCase() === color}
                onClick={() => setForm((f) => ({ ...f, color }))}
                className={`h-6 w-6 rounded-full border-2 transition ${form.color.toUpperCase() === color ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              aria-label="Custom colour"
              type="color"
              value={form.color}
              onChange={set("color")}
              className="h-6 w-8 cursor-pointer rounded border border-gray-700 bg-transparent"
            />
          </div>
        </div>

        {editing && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="h-4 w-4 accent-emerald-500"
            />
            Active (can be assigned to staff)
          </label>
        )}

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

export default ShiftFormModal;
