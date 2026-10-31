import { FiFilter } from "react-icons/fi";

import Filters from "../ui/Filters";
import FilterByDate from "../ui/FilterByDate";
import SearchBar from "../ui/SearchBar";
import ResetButton from "../ui/button/ResetButton";
import ActionButton from "../ui/button/ActionButton";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "HOLIDAY", label: "Holiday" },
];

const Field = ({ label, children }) => (
  <div className="text-xs text-gray-400">
    <span className="mb-1.5 block font-medium text-gray-300">{label}</span>
    {children}
  </div>
);

const AttendanceFilters = ({
  values,
  onChange,
  onApply,
  onClear,
  departments = [],
  designations = [],
  error = "",
}) => {
  const visibleDesignations = values.department_id
    ? designations.filter(
        (item) => String(item.departmentId) === values.department_id,
      )
    : designations;

  const select = (name, options) => (
    <Filters
      filters={[{ name, options }]}
      values={values}
      onChange={onChange}
    />
  );

  return (
    <form
      aria-label="Attendance filters"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      className="rounded-xl border border-gray-800 bg-[#111111] p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <Field label="Date Range">
          <div className="flex items-center gap-2 [&_div]:w-full">
            <FilterByDate
              value={values.from}
              onChange={(date) => onChange("from", date)}
              label="From date"
            />
            <span className="text-gray-500">-</span>
            <FilterByDate
              value={values.to}
              onChange={(date) => onChange("to", date)}
              label="To date"
            />
          </div>
        </Field>

        <Field label="Department">
          <div className="[&_.relative]:w-full [&_select]:w-full">
            {select("department_id", [
              { value: "", label: "All Departments" },
              ...departments.map((item) => ({
                value: item._id,
                label: item.name,
              })),
            ])}
          </div>
        </Field>

        <Field label="Designation">
          <div className="[&_.relative]:w-full [&_select]:w-full">
            {select("designation_id", [
              { value: "", label: "All Designations" },
              ...visibleDesignations.map((item) => ({
                value: item._id,
                label: item.name,
              })),
            ])}
          </div>
        </Field>

        <Field label="Status">
          <div className="[&_.relative]:w-full [&_select]:w-full">
            {select("status", STATUS_OPTIONS)}
          </div>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1 [&>div]:w-full">
          <SearchBar
            searchTerm={values.q}
            setSearchTerm={(value) => onChange("q", value)}
            placeholder="Search by name, staff ID..."
          />
        </div>

        <ResetButton onClick={onClear} label="Clear Filters" />
        <ActionButton type="submit" icon={<FiFilter size={13} />}>
          Apply Filters
        </ActionButton>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
};

export default AttendanceFilters;
