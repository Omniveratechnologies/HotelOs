import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import { StaffAvatar } from "../reports/ReportBadges.jsx";
import {
  BAND_LABEL,
  bandColor,
  formatMonthLabel,
  percentText,
} from "../../utils/monthlyReportUtils.js";
const MonthlyStaffModal = ({ row, onClose }) => {
  if (!row) return null;

  const items = [
    ["Department", row.department?.name || "-"],
    ["Present", row.present],
    ["Late", row.late],
    ["Half day", row.halfDay],
    ["Absent", row.absent],
    ["On leave", row.leave],
    ["Holiday", row.holiday],
    ["Total days", row.totalDays],
    ["Working days", row.workingDays],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Monthly attendance details"
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
          <p className="text-[11px] text-gray-400">
            {row.staff.staffCode} · {formatMonthLabel(row.month)}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-lg font-bold"
            style={{ color: bandColor(row.band) }}
          >
            {percentText(row.attendancePercent)}
          </p>
          <p className="text-[10px] text-gray-500">
            {BAND_LABEL[row.band] || "No working days"}
          </p>
        </div>
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

export default MonthlyStaffModal;
