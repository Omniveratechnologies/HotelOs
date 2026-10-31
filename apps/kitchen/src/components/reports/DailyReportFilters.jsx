import { FiCalendar, FiRotateCcw } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import {
  STATUS_LABEL,
  STATUS_OPTIONS,
  fieldCls,
  inputCls,
} from "../../utils/dailyreportUtils.js";

const DailyReportFilters = ({
  draft,
  departments,
  designations,
  devices,
  dirty,
  loading,
  onChange,
  onApply,
  onReset,
}) => {
  const select = `${fieldCls} h-10 w-auto min-w-[150px] flex-1 pr-8`;

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target.tagName === "INPUT")
          onApply();
      }}
      role="group"
      className="flex flex-wrap items-center gap-3 lg:flex-nowrap"
      aria-label="Report filters"
    >
      <div className="relative shrink-0">
        <FiCalendar
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
        />
        <input
          type="date"
          value={draft.date}
          max="2100-12-31"
          min="2000-01-01"
          onChange={(e) => onChange("date", e.target.value)}
          aria-label="Report date"
          className={`${inputCls} h-10 w-[170px] pl-9`}
        />
      </div>

      <select
        value={draft.department}
        onChange={(e) => onChange("department", e.target.value)}
        aria-label="Department"
        className={select}
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={draft.designation}
        onChange={(e) => onChange("designation", e.target.value)}
        aria-label="Designation"
        className={select}
      >
        <option value="">All Designations</option>
        {designations.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={draft.status}
        onChange={(e) => onChange("status", e.target.value)}
        aria-label="Status"
        className={select}
      >
        <option value="">All Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <select
        value={draft.device}
        onChange={(e) => onChange("device", e.target.value)}
        aria-label="Device"
        className={select}
      >
        <option value="">All Devices</option>
        {devices.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      <ActionButton
        variant="outline"
        icon={<FiRotateCcw size={13} />}
        onClick={onReset}
        className="h-10 shrink-0"
      >
        Reset
      </ActionButton>
      <ActionButton
        onClick={onApply}
        disabled={loading || !draft.date}
        className={`h-10 shrink-0 px-6 ${dirty ? "ring-2 ring-emerald-300/40" : ""}`}
      >
        {loading ? "Loading..." : "Apply"}
      </ActionButton>
    </div>
  );
};

export default DailyReportFilters;
