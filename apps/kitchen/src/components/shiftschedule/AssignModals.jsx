import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import {
  WEEKDAYS,
  addDays,
  formatLong,
  inputCls,
  labelCls,
  localToday,
  post,
  query,
  request,
} from "../../utils/shiftScheduleUtils.js";

const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className={labelCls}>{label}</span>
    {children}
  </label>
);

const Chip = ({ on, onClick, children, label }) => (
  <button
    type="button"
    aria-pressed={on}
    aria-label={label}
    onClick={onClick}
    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
      on
        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
        : "border-gray-700 text-gray-400 hover:bg-gray-800"
    }`}
  >
    {children}
  </button>
);

const DepartmentSelect = ({
  value,
  onChange,
  allLabel = "All departments",
  ariaLabel = "Department",
}) => {
  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    request("/staffManagement/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    >
      <option value="">{allLabel}</option>
      {departments.map((d) => (
        <option key={d._id} value={d._id}>
          {d.name}
        </option>
      ))}
    </select>
  );
};

const ResultPanel = ({ result }) => {
  if (!result) return null;
  const skipped = result.skipped?.items || [];
  const warnings = result.warnings?.items || [];
  const unmet = result.unmetCoverage?.items || [];
  const figures = [
    ["Assigned", result.assigned],
    ["Replaced", result.replaced],
    ["Unchanged", result.unchanged],
    ["Days off", result.daysOff],
    ["Skipped", result.skipped?.total],
    ["Warnings", result.warnings?.total],
    ["Short of cover", result.unmetCoverage?.total],
  ].filter(([, value]) => value !== undefined);

  return (
    <div
      role="region"
      aria-label={result.dryRun ? "Preview result" : "Result"}
      className="space-y-2 rounded-lg border border-gray-800 bg-[#111111] p-3 text-xs"
    >
      <p className="font-medium text-white">
        {result.dryRun ? "Preview (nothing saved yet)" : "Done"}
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-gray-300">
        {figures.map(([label, value]) => (
          <li key={label}>
            {label}: <span className="font-semibold text-white">{value}</span>
          </li>
        ))}
      </ul>
      {unmet.length > 0 && (
        <div>
          <p className="mb-1 text-yellow-400">Not enough people for:</p>
          <ul className="max-h-24 space-y-0.5 overflow-y-auto text-gray-400">
            {unmet.map((u, i) => (
              <li key={i}>
                {u.date} · {u.shiftName}: {u.actual} of {u.required}
              </li>
            ))}
          </ul>
        </div>
      )}
      {skipped.length > 0 && (
        <div>
          <p className="mb-1 text-red-300">Skipped:</p>
          <ul className="max-h-28 space-y-0.5 overflow-y-auto text-gray-400">
            {skipped.slice(0, 30).map((s, i) => (
              <li key={i}>
                {s.staffName} · {s.date} · {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div>
          <p className="mb-1 text-yellow-400">Heads up:</p>
          <ul className="max-h-24 space-y-0.5 overflow-y-auto text-gray-400">
            {warnings.slice(0, 20).map((w, i) => (
              <li key={i}>
                {w.staffName} · {w.date} · {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.preview?.length > 0 && (
        <details>
          <summary className="cursor-pointer text-gray-400">
            Sample of the plan ({result.preview.length})
          </summary>
          <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-gray-400">
            {result.preview.map((p, i) => (
              <li key={i}>
                {p.date} · {p.staffName} · {p.shift}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

const Alert = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-950 px-3 py-2 text-xs text-red-200"
    >
      {children}
    </p>
  ) : null;

export const BulkAssignModal = ({ shifts, onClose, onDone }) => {
  const tomorrow = addDays(localToday(), 1);
  const [mode, setMode] = useState("department");
  const [departmentId, setDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [picked, setPicked] = useState(() => new Set());
  const [shiftId, setShiftId] = useState(shifts[0]?._id || "");
  const [fromDate, setFromDate] = useState(tomorrow);
  const [toDate, setToDate] = useState(tomorrow);
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [overwrite, setOverwrite] = useState(false);
  const [strictRest, setStrictRest] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "staff") return undefined;
    const timer = setTimeout(() => {
      request(
        `/staffManagement?${query({ status: "ACTIVE", limit: 100, search: search.trim(), department_id: departmentId })}`,
      )
        .then((res) => setPeople(res.data || []))
        .catch(() => setPeople([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [mode, search, departmentId]);

  const togglePerson = (id) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const body = (dryRun) => ({
    ...(mode === "department" ? { departmentId } : { staffIds: [...picked] }),
    shiftId: shiftId === "OFF" ? null : shiftId,
    fromDate,
    toDate,
    ...(days.length < 7 ? { daysOfWeek: days } : {}),
    overwrite,
    strictRest,
    dryRun,
  });

  const run = async (dryRun) => {
    setError("");
    if (mode === "department" && !departmentId)
      return setError("Choose a department.");
    if (mode === "staff" && picked.size === 0)
      return setError("Pick at least one person.");
    if (!shiftId) return setError("Choose a shift or Day off.");
    if (days.length === 0) return setError("Choose at least one weekday.");
    setBusy(true);
    try {
      const res = await post("/schedule/bulk-assign", body(dryRun));
      setResult(res.data);
      if (!dryRun && res.data.assigned > 0)
        onDone(
          `Schedule updated for ${res.data.assigned} day${res.data.assigned === 1 ? "" : "s"}`,
        );
      else if (!dryRun) setError("Nothing was changed. See why below.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Bulk Assign"
      maxWidth="max-w-xl"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose} disabled={busy}>
            Close
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={() => run(true)}
            disabled={busy}
          >
            Preview
          </ActionButton>
          <ActionButton onClick={() => run(false)} disabled={busy}>
            {busy ? "Working..." : "Assign"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2" role="radiogroup" aria-label="Who">
          <Chip
            on={mode === "department"}
            onClick={() => setMode("department")}
          >
            Whole department
          </Chip>
          <Chip on={mode === "staff"} onClick={() => setMode("staff")}>
            Pick staff
          </Chip>
        </div>

        <Field label="Department">
          <DepartmentSelect
            value={departmentId}
            onChange={setDepartmentId}
            allLabel={
              mode === "staff" ? "All departments" : "Choose department"
            }
          />
        </Field>

        {mode === "staff" && (
          <div className="space-y-2">
            <input
              aria-label="Search staff"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or staff ID"
              className={inputCls}
            />
            <ul
              aria-label="Staff list"
              className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-gray-800 p-1"
            >
              {people.map((p) => (
                <li key={p._id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-gray-300 hover:bg-[#1a1a1a]">
                    <input
                      type="checkbox"
                      checked={picked.has(p._id)}
                      onChange={() => togglePerson(p._id)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    {p.name}{" "}
                    <span className="text-gray-500">({p.staffCode})</span>
                    <span className="ml-auto text-[10px] text-gray-500">
                      {p.department}
                    </span>
                  </label>
                </li>
              ))}
              {people.length === 0 && (
                <li className="px-2 py-3 text-center text-xs text-gray-500">
                  No staff found.
                </li>
              )}
            </ul>
            <p className="text-[11px] text-gray-500">{picked.size} selected</p>
          </div>
        )}

        <Field label="Shift">
          <select
            aria-label="Shift"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className={inputCls}
          >
            {shifts.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.timeLabel})
              </option>
            ))}
            <option value="OFF">Day off</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <input
              aria-label="From date"
              type="date"
              value={fromDate}
              min={localToday()}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (toDate < e.target.value) setToDate(e.target.value);
              }}
              className={inputCls}
            />
          </Field>
          <Field label="To">
            <input
              aria-label="To date"
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="space-y-1.5">
          <span className={labelCls}>On these days</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((name, index) => (
              <Chip
                key={name}
                label={`Weekday ${name}`}
                on={days.includes(index)}
                onClick={() =>
                  setDays((d) =>
                    d.includes(index)
                      ? d.filter((x) => x !== index)
                      : [...d, index],
                  )
                }
              >
                {name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-gray-300">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Replace days that are already booked
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={strictRest}
              onChange={(e) => setStrictRest(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Skip days with less than the minimum rest between shifts
          </label>
        </div>

        <Alert>{error}</Alert>
        <ResultPanel result={result} />
      </div>
    </Modal>
  );
};

export const AutoScheduleModal = ({ shifts, onClose, onDone }) => {
  const start = addDays(localToday(), 1);
  const [fromDate, setFromDate] = useState(start);
  const [toDate, setToDate] = useState(addDays(start, 6));
  const [departmentId, setDepartmentId] = useState("");
  const [pool, setPool] = useState(() => new Set(shifts.map((s) => s._id)));
  const [offDays, setOffDays] = useState([0]);
  const [rotate, setRotate] = useState(false);
  const [minRest, setMinRest] = useState(8);
  const [coverage, setCoverage] = useState([]);
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const poolShifts = useMemo(
    () => shifts.filter((s) => pool.has(s._id)),
    [shifts, pool],
  );

  const body = (dryRun) => ({
    fromDate,
    toDate,
    ...(departmentId ? { departmentId } : {}),
    shiftIds: [...pool],
    weeklyOffDays: offDays,
    rotateWeeklyOff: rotate,
    minRestHours: Number(minRest),
    coverage: coverage
      .filter((c) => c.shiftId && Number(c.min) >= 1)
      .map((c) => ({
        shiftId: c.shiftId,
        min: Number(c.min),
        ...(c.departmentId ? { departmentId: c.departmentId } : {}),
      })),
    overwrite,
    dryRun,
  });

  const run = async (dryRun) => {
    setError("");
    if (pool.size === 0)
      return setError("Choose at least one shift to schedule with.");
    setBusy(true);
    try {
      const res = await post("/schedule/auto", body(dryRun));
      setResult(res.data);
      if (!dryRun)
        onDone(
          `Auto schedule applied: ${res.data.assigned} shifts, ${res.data.daysOff} days off`,
        );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Auto Schedule"
      maxWidth="max-w-xl"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose} disabled={busy}>
            Close
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={() => run(true)}
            disabled={busy}
          >
            Preview
          </ActionButton>
          <ActionButton onClick={() => run(false)} disabled={busy}>
            {busy ? "Working..." : "Apply schedule"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Skips approved leave and holidays, keeps weekly offs, avoids overlaps
          and short rest, and tops up shifts below their minimum. Days you
          booked by hand are kept.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <input
              aria-label="From date"
              type="date"
              value={fromDate}
              min={localToday()}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (toDate < e.target.value) setToDate(e.target.value);
              }}
              className={inputCls}
            />
          </Field>
          <Field label="To">
            <input
              aria-label="To date"
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Department">
          <DepartmentSelect
            value={departmentId}
            onChange={setDepartmentId}
            allLabel="All departments"
          />
        </Field>

        <div className="space-y-1.5">
          <span className={labelCls}>Shifts to use</span>
          <div className="flex flex-wrap gap-1.5">
            {shifts.map((s) => (
              <Chip
                key={s._id}
                label={`Use ${s.name}`}
                on={pool.has(s._id)}
                onClick={() =>
                  setPool((cur) => {
                    const next = new Set(cur);
                    if (next.has(s._id)) next.delete(s._id);
                    else next.add(s._id);
                    return next;
                  })
                }
              >
                {s.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className={labelCls}>Weekly off</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((name, index) => (
              <Chip
                key={name}
                label={`Off ${name}`}
                on={offDays.includes(index)}
                onClick={() =>
                  setOffDays((d) =>
                    d.includes(index)
                      ? d.filter((x) => x !== index)
                      : [...d, index],
                  )
                }
              >
                {name}
              </Chip>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={rotate}
              onChange={(e) => setRotate(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Rotate the weekly off across staff (so everyone is not off the same
            day)
          </label>
        </div>

        <Field label="Minimum rest between shifts (hours)">
          <input
            aria-label="Minimum rest hours"
            type="number"
            min="0"
            max="24"
            value={minRest}
            onChange={(e) => setMinRest(e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>
              Minimum people per shift (optional)
            </span>
            <button
              type="button"
              disabled={poolShifts.length === 0}
              onClick={() =>
                setCoverage((c) => [
                  ...c,
                  { shiftId: poolShifts[0]._id, min: 1, departmentId: "" },
                ])
              }
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
            >
              <FiPlus size={12} /> Add rule
            </button>
          </div>
          {coverage.map((rule, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
              role="group"
              aria-label={`Coverage rule ${index + 1}`}
            >
              <select
                aria-label={`Rule ${index + 1} shift`}
                value={rule.shiftId}
                onChange={(e) =>
                  setCoverage((c) =>
                    c.map((r, i) =>
                      i === index ? { ...r, shiftId: e.target.value } : r,
                    ),
                  )
                }
                className={inputCls}
              >
                {poolShifts.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Rule ${index + 1} minimum`}
                type="number"
                min="1"
                value={rule.min}
                onChange={(e) =>
                  setCoverage((c) =>
                    c.map((r, i) =>
                      i === index ? { ...r, min: e.target.value } : r,
                    ),
                  )
                }
                className={`${inputCls} max-w-[80px]`}
              />
              <button
                type="button"
                aria-label={`Remove rule ${index + 1}`}
                onClick={() =>
                  setCoverage((c) => c.filter((_, i) => i !== index))
                }
                className="rounded-md border border-gray-700 p-2 text-gray-400 hover:bg-gray-800"
              >
                <FiX size={13} />
              </button>
            </div>
          ))}
          {coverage.length > 0 && (
            <p className="text-[10px] text-gray-500">
              Applies to the department chosen above (or the whole hotel).
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          Also replace days that were booked by hand
        </label>

        <Alert>{error}</Alert>
        <ResultPanel result={result} />
      </div>
    </Modal>
  );
};

export const CellAssignModal = ({ target, shifts, onClose, onDone }) => {
  const [choice, setChoice] = useState(
    target.shift?._id || (target.state === "OFF" ? "OFF" : ""),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setError("");
    if (!choice) return setError("Choose a shift or Day off.");
    setBusy(true);
    try {
      if (choice === "DEFAULT") {
        await post("/schedule/clear", {
          staffIds: [target.staff._id],
          fromDate: target.date,
          toDate: target.date,
        });
        onDone(`${target.staff.name} is back on the default shift`);
        return;
      }
      const res = await post("/schedule/assign", {
        staffId: target.staff._id,
        shiftId: choice === "OFF" ? null : choice,
        fromDate: target.date,
        overwrite: true,
      });
      const skipped = res.data.skipped?.items?.[0];
      if (skipped) {
        setError(skipped.reason);
        setBusy(false);
        return;
      }
      const warning = res.data.warnings?.items?.[0];
      onDone(warning ? `Saved. ${warning.message}` : "Schedule updated");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const option = (value, label, hint) => (
    <label
      key={value}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs transition ${choice === value ? "border-emerald-500/60 bg-emerald-500/10 text-white" : "border-gray-800 text-gray-300 hover:bg-[#1a1a1a]"}`}
    >
      <input
        type="radio"
        name="cell-choice"
        value={value}
        checked={choice === value}
        onChange={() => setChoice(value)}
        className="accent-emerald-500"
      />
      <span className="font-medium">{label}</span>
      {hint && (
        <span className="ml-auto text-[11px] text-gray-500">{hint}</span>
      )}
    </label>
  );

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Change schedule"
      maxWidth="max-w-md"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </ActionButton>
          <ActionButton onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-gray-400">
          <span className="font-medium text-white">{target.staff.name}</span> ·{" "}
          {formatLong(target.date)}
        </p>
        <div className="space-y-1.5" role="radiogroup" aria-label="Shift">
          {shifts.map((s) => option(s._id, s.name, s.timeLabel))}
          {option("OFF", "Day off")}
          {target.explicit &&
            option("DEFAULT", "Back to default", "remove this booking")}
        </div>
        <Alert>{error}</Alert>
      </div>
    </Modal>
  );
};
