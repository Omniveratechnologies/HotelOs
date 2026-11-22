import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import { StaffAvatar, StatusPill } from "./ReportBadges.jsx";
import {
  formatClockTime,
  formatDateKey,
} from "../../utils/dailyreportUtils.js";

const DailyRecordModal = ({ row, onClose }) => {
  if (!row) return null;

  const items = [
    ["Date", formatDateKey(row.date)],
    ["Department", row.department?.name || "-"],
    ["Designation", row.designation?.name || "-"],
    ["Check in", formatClockTime(row.checkInAt)],
    ["Check out", formatClockTime(row.checkOutAt)],
    ["Work hours", row.workingHours],
    ["Device", row.device?.name || "-"],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Attendance details"
      maxWidth="max-w-md"
      footer={
        <ActionButton variant="outline" onClick={onClose}>
          Close
        </ActionButton>
      }
    >
      <div className="flex items-center gap-3">
        <StaffAvatar
          src={row.staff.photoUrl}
          name={row.staff.name}
          size="h-11 w-11"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {row.staff.name}
          </p>
          <p className="text-[11px] text-gray-400">{row.staff.staffCode}</p>
        </div>
        <StatusPill status={row.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        {items.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-200">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
};

export default DailyRecordModal;
