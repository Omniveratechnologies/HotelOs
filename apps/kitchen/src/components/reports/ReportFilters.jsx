import { FiFilter } from "react-icons/fi";
import FormField from "../ui/FormField.jsx";
import {
  REPORT_FILTERS,
  REPORT_TYPES,
  STATUS_OPTIONS,
} from "../../utils/exportReport.constants.js";

const EMPTY_ARRAY = [];

const typeOptions = REPORT_TYPES.map(({ value, label }) => ({ value, label }));

const ReportFilters = ({
  values,
  onChange,
  departments = EMPTY_ARRAY,
  designations = EMPTY_ARRAY,
  devices = EMPTY_ARRAY,
}) => {
  const rules = REPORT_FILTERS[values.type] || REPORT_FILTERS.ATTENDANCE;
  const statusOptions = STATUS_OPTIONS[values.type] || EMPTY_ARRAY;

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b1117] p-4">
      <div className="mb-4 flex items-center gap-2">
        <FiFilter size={15} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-white">Report Filters</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="Report Type"
            name="type"
            type="select"
            value={values.type}
            options={typeOptions}
            onValueChange={(type) => type && onChange({ type, status: "" })}
          />
        </div>

        <FormField
          label="From Date"
          name="from"
          type="date"
          value={values.from}
          max={values.to || undefined}
          disabled={!rules.dateRange}
          onValueChange={(from) => onChange({ from })}
        />

        <FormField
          label="To Date"
          name="to"
          type="date"
          value={values.to}
          min={values.from || undefined}
          disabled={!rules.dateRange}
          onValueChange={(to) => onChange({ to })}
        />

        <FormField
          label="Department"
          name="departmentId"
          type="select"
          emptyLabel="All Departments"
          value={values.departmentId}
          options={departments}
          disabled={!rules.department}
          onValueChange={(departmentId) => onChange({ departmentId })}
        />

        <FormField
          label="Designation"
          name="designationId"
          type="select"
          emptyLabel="All Designations"
          value={values.designationId}
          options={designations}
          disabled={!rules.designation}
          onValueChange={(designationId) => onChange({ designationId })}
        />

        <FormField
          label="Status"
          name="status"
          type="select"
          emptyLabel="All Status"
          value={values.status}
          options={statusOptions}
          disabled={!rules.status}
          onValueChange={(status) => onChange({ status })}
        />

        <FormField
          label="Device"
          name="deviceId"
          type="select"
          emptyLabel="All Devices"
          value={values.deviceId}
          options={devices}
          disabled={!rules.device}
          onValueChange={(deviceId) => onChange({ deviceId })}
        />
      </div>
    </section>
  );
};

export default ReportFilters;
