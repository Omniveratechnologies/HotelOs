import { UserRound } from "lucide-react";
import AddStaffCard from "./AddStaffCard";
import FormField from "../ui/FormField";

const PersonalInformation = ({ register, errors, age }) => (
  <AddStaffCard
    title="Personal Information"
    subtitle="Enter the staff member's personal details."
    icon={UserRound}
  >
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField
        label="Full Name"
        name="name"
        register={register}
        error={errors.name}
        required
        placeholder="Enter full name"
        autoComplete="name"
      />

      <FormField
        label="Date of Birth"
        name="dob"
        type="date"
        register={register}
        error={errors.dob}
        max={new Date().toISOString().slice(0, 10)}
      />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-300">
          Age
        </label>
        <div
          className="rounded-lg border border-gray-800 bg-[#101010] px-3 py-2.5 text-sm text-gray-400"
          aria-live="polite"
        >
          {age === null ? "Calculated from date of birth" : `${age} years`}
        </div>
      </div>

      <FormField
        label="Phone Number"
        name="phone"
        type="tel"
        register={register}
        error={errors.phone}
        maxLength={10}
        required
        placeholder="Enter phone number"
        autoComplete="tel"
      />

      <FormField
        label="Email Address"
        name="email"
        type="email"
        register={register}
        error={errors.email}
        placeholder="name@example.com"
        autoComplete="email"
      />

      <FormField
        label="Government ID Type"
        name="govIdType"
        register={register}
        error={errors.govIdType}
        options={[
          { value: "AADHAAR", label: "Aadhaar" },
          { value: "PAN", label: "PAN" },
          { value: "PASSPORT", label: "Passport" },
          { value: "DRIVING_LICENSE", label: "Driving Licence" },
          { value: "VOTER_ID", label: "Voter ID" },
        ]}
        type="select"
      />

      <FormField
        label="Government ID Number"
        name="govIdNumber"
        register={register}
        error={errors.govIdNumber}
        placeholder="Enter government ID number"
      />

      <div className="sm:col-span-2 lg:col-span-3">
        <FormField
          label="Residential Address"
          name="address"
          type="textarea"
          register={register}
          error={errors.address}
          placeholder="Enter complete address"
        />
      </div>
    </div>
  </AddStaffCard>
);

export default PersonalInformation;
