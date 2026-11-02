import { useState } from "react";
import { FiEdit2, FiUsers, FiX } from "react-icons/fi";

import StatusBadge from "../ui/StatusBadge";
import DepartmentIcon from "./DepartmentIcon.jsx";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";

const PersonAvatar = ({ src, name }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
        {getInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  );
};

const CountBox = ({ label, value, tone }) => (
  <div className={`rounded-lg border p-3 text-center ${tone}`}>
    <p className="text-lg font-semibold text-white">{value}</p>
    <p className="mt-0.5 text-[11px] text-gray-400">{label}</p>
  </div>
);

const StaffRow = ({ member, right }) => (
  <li className="flex items-center gap-3 py-2.5">
    <PersonAvatar src={member.photoUrl} name={member.name} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-gray-200">
        {member.name}
      </p>
      <p className="truncate text-[11px] text-gray-500">
        {member.designation || member.staffCode}
      </p>
    </div>
    {right}
  </li>
);

const TABS = ["overview", "designations", "staff"];

const DepartmentDetails = ({
  summary,
  loading = false,
  error = "",
  tab = "overview",
  onTabChange,
  designations,
  staff,
  onEdit,
  onManageStaff,
  onViewAll,
  onClose,
}) => {
  if (error) {
    return (
      <div className="p-5 text-center">
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <p className="p-8 text-center text-sm text-gray-400">
        Loading department...
      </p>
    );
  }

  const { department, counts, designationCount, recentStaff } = summary;

  const tabLabel = {
    overview: "Overview",
    designations: `Designations (${designationCount})`,
    staff: `Staff (${counts.total})`,
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="text-sm font-semibold text-white">{department.name}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-3">
          <DepartmentIcon
            icon={department.icon}
            color={department.color}
            size={22}
            boxClass="h-12 w-12"
          />
          <div>
            <p className="text-sm font-semibold text-white">
              {department.name}
            </p>
            <div className="mt-1">
              <StatusBadge status={department.status} />
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-gray-400">
          {department.description || "No description added."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="text-[11px] text-gray-500">Department Code</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {department.code || "-"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="text-[11px] text-gray-500">Total Staff</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {counts.total}
            </p>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Department sections"
        className="mt-4 flex border-b border-gray-800 px-5"
      >
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`dept-tab-${key}`}
            aria-selected={tab === key}
            aria-controls="dept-tab-panel"
            onClick={() => onTabChange?.(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-[11px] transition ${
              tab === key
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tabLabel[key]}
          </button>
        ))}
      </div>

      <div
        id="dept-tab-panel"
        role="tabpanel"
        aria-labelledby={`dept-tab-${tab}`}
        className="px-5 py-4"
      >
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <CountBox
                label="Active Staff"
                value={counts.active}
                tone="border-emerald-500/30 bg-emerald-500/5"
              />
              <CountBox
                label="On Leave"
                value={counts.onLeave}
                tone="border-orange-500/30 bg-orange-500/5"
              />
              <CountBox
                label="Inactive Staff"
                value={counts.inactive}
                tone="border-red-500/30 bg-red-500/5"
              />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white">
                Recent Staff in this Department
              </h3>
              <button
                type="button"
                onClick={onViewAll}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                View All →
              </button>
            </div>

            {recentStaff.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-500">
                No staff in this department yet.
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-gray-800">
                {recentStaff.map((member) => (
                  <StaffRow key={member._id} member={member} />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "designations" &&
          (designations?.loading ? (
            <p className="py-6 text-center text-xs text-gray-400">
              Loading designations...
            </p>
          ) : designations?.error ? (
            <p role="alert" className="py-6 text-center text-xs text-red-400">
              {designations.error}
            </p>
          ) : designations?.items?.length ? (
            <ul className="divide-y divide-gray-800">
              {designations.items.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <span className="text-gray-200">{item.name}</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <FiUsers size={12} />
                    {item.staffCount}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-gray-500">
              No designations in this department.
            </p>
          ))}

        {tab === "staff" &&
          (staff?.loading ? (
            <p className="py-6 text-center text-xs text-gray-400">
              Loading staff...
            </p>
          ) : staff?.error ? (
            <p role="alert" className="py-6 text-center text-xs text-red-400">
              {staff.error}
            </p>
          ) : staff?.items?.length ? (
            <ul className="divide-y divide-gray-800">
              {staff.items.map((member) => (
                <StaffRow
                  key={member._id}
                  member={{
                    ...member,
                    designation: member.designation || member.staffCode,
                  }}
                  right={<StatusBadge status={member.status} />}
                />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-gray-500">
              No staff in this department yet.
            </p>
          ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-gray-800 p-4">
        <button
          type="button"
          onClick={() => onEdit?.(department)}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2.5 text-xs text-gray-200 transition hover:bg-gray-800"
        >
          <FiEdit2 size={13} />
          Edit Department
        </button>
        <button
          type="button"
          onClick={onManageStaff}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-emerald-500"
        >
          <FiUsers size={13} />
          Manage Staff
        </button>
      </div>
    </div>
  );
};

export default DepartmentDetails;
