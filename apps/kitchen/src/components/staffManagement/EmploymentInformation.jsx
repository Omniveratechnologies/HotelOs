import { BriefcaseBusiness, RefreshCw } from "lucide-react";
import FormField from "../ui/FormField.jsx";
import AddStaffCard from "./AddStaffCard.jsx";

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const labelClass = "mb-1.5 block text-xs font-medium text-gray-300";
const inputClass =
  "w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-600";

const Required = () => <span className="text-red-400"> *</span>;

const RadioGroup = ({ label, name, options, register, error }) => (
  <fieldset>
    <legend className={labelClass}>
      {label}
      <Required />
    </legend>

    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-1.5">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-300"
        >
          <input
            type="radio"
            value={option.value}
            {...register(name)}
            className="h-4 w-4 cursor-pointer accent-emerald-500"
          />
          {option.label}
        </label>
      ))}
    </div>

    {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
  </fieldset>
);

const EmploymentInformation = ({
  register,
  errors,
  departments = [],
  designations = [],
  shifts = [],
  staff = [],
  onDepartmentChange,
  loadingDesignations,
  designationHint,

  staffCode = "",
  onRefreshStaffCode,
  refreshingStaffCode = false,
  canRefreshStaffCode = true,
  notes = "",
  onNotesChange,
}) => (
  <AddStaffCard
    title="Employment Information"
    subtitle="Assign the department, designation, and work schedule."
    icon={BriefcaseBusiness}
  >
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label htmlFor="staffCode" className={labelClass}>
          Staff ID
          <Required />
        </label>

        <div className="flex items-center gap-2">
          <input
            id="staffCode"
            type="text"
            value={staffCode}
            readOnly
            placeholder="Auto-generated"
            className={`${inputClass} cursor-not-allowed bg-gray-900 text-gray-400`}
          />

          {canRefreshStaffCode && (
            <button
              type="button"
              onClick={onRefreshStaffCode}
              disabled={refreshingStaffCode}
              title="Generate a new Staff ID"
              aria-label="Generate a new Staff ID"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-700 text-emerald-400 transition hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshingStaffCode ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>
      </div>

      <FormField
        label="Department"
        name="departmentId"
        type="select"
        register={register}
        error={errors.departmentId}
        options={departments.map((item) => ({
          value: item._id,
          label: item.name,
        }))}
        onValueChange={onDepartmentChange}
        //required
      />

      <div>
        <FormField
          label="Designation"
          name="designationId"
          type="select"
          register={register}
          error={errors.designationId}
          options={designations.map((item) => ({
            value: item._id,
            label: item.name,
          }))}
          disabled={loadingDesignations || !designations.length}
          //required
        />
        {designationHint && (
          <p className="mt-1 text-xs text-amber-400">{designationHint}</p>
        )}
      </div>

      <FormField
        label="Joining Date"
        name="joinedOn"
        type="date"
        register={register}
        error={errors.joinedOn}
        //required
      />

      <FormField
        label="Shift"
        name="shiftId"
        type="select"
        register={register}
        error={errors.shiftId}
        options={shifts.map((item) => ({
          value: item._id,
          label: `${item.name} (${item.startTime}–${item.endTime})`,
        }))}
      />

      <FormField
        label="Reporting Manager"
        name="managerId"
        type="select"
        register={register}
        error={errors.managerId}
        options={staff.map((item) => ({
          value: item._id,
          label: `${item.name} (${item.staffCode})`,
        }))}
      />

      <div className="sm:col-span-2 lg:col-span-2">
        <RadioGroup
          label="Employment Type"
          name="employmentType"
          options={EMPLOYMENT_TYPES}
          register={register}
          error={errors.employmentType}
        />
      </div>

      <RadioGroup
        label="Status"
        name="status"
        options={STATUSES}
        register={register}
        error={errors.status}
      />

      <div className="sm:col-span-2 lg:col-span-3">
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="text-gray-500">(Optional)</span>
        </label>

        <textarea
          id="notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(event) => onNotesChange?.(event.target.value)}
          placeholder="Additional notes about the staff member..."
          className={`${inputClass} resize-y`}
        />
      </div>
    </div>
  </AddStaffCard>
);

export default EmploymentInformation;
