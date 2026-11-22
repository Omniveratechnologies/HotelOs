import { useEffect, useState } from "react";

import Modal from "../ui/Modal";
import ActionButton from "../ui/button/ActionButton";
import StatusBadge from "../ui/StatusBadge";
import Avatar from "../ui/Avatar";
import { fetchAttendanceDetail } from "../../services/attendanceApi.js";
import { formatDate, formatTime } from "../../utils/attendanceFormat.js";

const FIELD_LABELS = {
  status: "Status",
  checkInAt: "Check In",
  checkOutAt: "Check Out",
  remarks: "Remarks",
};

const showValue = (field, value) => {
  if (value === null || value === undefined || value === "") return "-";
  return field === "checkInAt" || field === "checkOutAt"
    ? formatTime(value)
    : String(value);
};

const Item = ({ label, children }) => (
  <div>
    <dt className="text-[11px] text-gray-500">{label}</dt>
    <dd className="mt-0.5 text-xs text-gray-200">{children}</dd>
  </div>
);

const AttendanceDetailsModal = ({ open, record, onClose, onCorrect }) => {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !record) return undefined;

    let cancelled = false;
    setDetail(null);
    setError("");

    fetchAttendanceDetail(record._id)
      .then((data) => !cancelled && setDetail(data))
      .catch((requestError) => !cancelled && setError(requestError.message));

    return () => {
      cancelled = true;
    };
  }, [open, record]);

  if (!record) return null;

  const row = detail || record;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance details"
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton variant="outline" onClick={onClose}>
            Close
          </ActionButton>
          <ActionButton onClick={() => onCorrect?.(row)}>
            Correct attendance
          </ActionButton>
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar src={row.staff.photoUrl} name={row.staff.name} size={44} />
        <div>
          <p className="text-sm font-semibold text-white">{row.staff.name}</p>
          <p className="text-xs text-gray-500">
            {row.staff.staffCode} ·{" "}
            {[row.department?.name, row.designation?.name]
              .filter(Boolean)
              .join(" · ") || "-"}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={row.status} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Item label="Date">{formatDate(row.date)}</Item>
        <Item label="Shift">
          {row.shift
            ? `${row.shift.name} (${row.shift.startTime} - ${row.shift.endTime})`
            : "-"}
        </Item>
        <Item label="Working hours">{row.workingHours}</Item>
        <Item label="Check in">{formatTime(row.checkInAt)}</Item>
        <Item label="Check out">{formatTime(row.checkOutAt)}</Item>
        <Item label="Source">
          {row.source === "face"
            ? "Face kiosk"
            : row.source === "manual"
              ? "Manual"
              : "System"}
        </Item>
        {row.confidence !== null && row.confidence !== undefined && (
          <Item label="Face match">{Math.round(row.confidence * 100)}%</Item>
        )}
        {row.remarks && <Item label="Remarks">{row.remarks}</Item>}
      </dl>

      <h3 className="mt-6 text-xs font-semibold text-white">
        Correction history
      </h3>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      ) : !detail ? (
        <p className="mt-2 text-xs text-gray-500">Loading...</p>
      ) : detail.history.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          This record was never changed by hand.
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {detail.history.map((entry) => (
            <li
              key={entry._id}
              className="rounded-lg border border-gray-800 p-3 text-xs"
            >
              <p className="text-gray-300">
                <span className="font-medium">
                  {entry.action === "CREATE" ? "Added manually" : "Corrected"}
                </span>
                {entry.changedByName ? ` by ${entry.changedByName}` : ""} ·{" "}
                <span className="text-gray-500">
                  {formatDate(String(entry.createdAt).slice(0, 10))}{" "}
                  {formatTime(entry.createdAt)}
                </span>
              </p>
              <p className="mt-1 text-gray-400">Reason: {entry.reason}</p>
              <ul className="mt-1 space-y-0.5 text-gray-500">
                {entry.changes.map((change) => (
                  <li key={change.field}>
                    {FIELD_LABELS[change.field] || change.field}:{" "}
                    {showValue(change.field, change.from)} &rarr;{" "}
                    {showValue(change.field, change.to)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default AttendanceDetailsModal;
