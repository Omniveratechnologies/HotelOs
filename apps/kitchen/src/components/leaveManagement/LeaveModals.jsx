import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

import { LeaveStatusBadge, LeaveTypeBadge } from "./LeaveBadges.jsx";
import {
  buttonGhost,
  buttonPrimary,
  formatAppliedDate,
  formatLeaveDate,
  inputCls,
  request,
} from "../../utils/leaveManagementUtils.js";

const Modal = ({ title, onClose, children, footer }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-gray-500 transition hover:text-white"
        >
          <FiX size={16} />
        </button>
      </div>
      <div className="space-y-4 px-5 py-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-gray-800 px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-[11px] font-medium text-gray-400">{label}</span>
    {children}
  </label>
);

const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 text-xs">
    <span className="shrink-0 text-gray-500">{label}</span>
    <span className="text-right text-gray-200">{children}</span>
  </div>
);

export const ApplyLeaveModal = ({ leaveTypes, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [form, setForm] = useState({
    staffId: "",
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      request(
        `/staffManagement?status=ACTIVE&limit=20&search=${encodeURIComponent(employeeSearch.trim())}`,
      )
        .then((res) => setEmployees(res.data || []))
        .catch(() => setEmployees([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const totalDays =
    form.fromDate && form.toDate && form.toDate >= form.fromDate
      ? Math.round(
          (new Date(form.toDate) - new Date(form.fromDate)) / 86400000,
        ) + 1
      : 0;

  const submit = async () => {
    setError("");
    if (!form.staffId || !form.leaveTypeId || !form.fromDate || !form.toDate) {
      setError("Select an employee, a leave type and both dates.");
      return;
    }
    if (form.reason.trim().length < 3) {
      setError("Please write a reason (at least 3 characters).");
      return;
    }
    if (form.toDate < form.fromDate) {
      setError("The end date can't be before the start date.");
      return;
    }
    setSubmitting(true);
    try {
      await request("/leaveManagement", {
        method: "POST",
        body: JSON.stringify({
          staffId: form.staffId,
          leaveTypeId: form.leaveTypeId,
          fromDate: form.fromDate,
          toDate: form.toDate,
          reason: form.reason.trim(),
        }),
      });
      onSuccess("Leave request submitted");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Apply leave"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhost}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={buttonPrimary}
          >
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </>
      }
    >
      <Field label="Employee">
        <input
          type="text"
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
          placeholder="Search by name or staff ID"
          className={`${inputCls} mb-2`}
        />
        <select
          value={form.staffId}
          onChange={set("staffId")}
          className={inputCls}
        >
          <option value="">Select employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name} ({emp.staffCode})
              {emp.department && emp.department !== "-"
                ? ` - ${emp.department}`
                : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Leave type">
        <select
          value={form.leaveTypeId}
          onChange={set("leaveTypeId")}
          className={inputCls}
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          <input
            type="date"
            value={form.fromDate}
            onChange={set("fromDate")}
            className={inputCls}
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={form.toDate}
            min={form.fromDate || undefined}
            onChange={set("toDate")}
            className={inputCls}
          />
        </Field>
      </div>

      {totalDays > 0 && (
        <p className="text-xs text-emerald-400">
          {totalDays} {totalDays === 1 ? "day" : "days"} requested
        </p>
      )}

      <Field label="Reason">
        <textarea
          rows={3}
          maxLength={500}
          value={form.reason}
          onChange={set("reason")}
          placeholder="Why do you need this leave?"
          className={`${inputCls} resize-none`}
        />
      </Field>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-950 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}
    </Modal>
  );
};

export const LeaveDetailsModal = ({ leaveId, onClose }) => {
  const [leave, setLeave] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    request(`/leaveManagement/${leaveId}`)
      .then((res) => setLeave(res.data))
      .catch((err) => setError(err.message));
  }, [leaveId]);

  return (
    <Modal
      title="Leave request"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={buttonGhost}>
          Close
        </button>
      }
    >
      {error && <p className="text-xs text-red-300">{error}</p>}
      {!leave && !error && <p className="text-xs text-gray-500">Loading...</p>}
      {leave && (
        <div className="space-y-3">
          <DetailRow label="Employee">
            {leave.staff?.name} ({leave.staff?.staffCode})
          </DetailRow>
          <DetailRow label="Department">
            {leave.department?.name ?? "-"}
          </DetailRow>
          <DetailRow label="Leave type">
            <LeaveTypeBadge type={leave.leaveType} />
          </DetailRow>
          <DetailRow label="From">{formatLeaveDate(leave.fromDate)}</DetailRow>
          <DetailRow label="To">{formatLeaveDate(leave.toDate)}</DetailRow>
          <DetailRow label="Total days">{leave.days}</DetailRow>
          <DetailRow label="Working days">{leave.workingDays}</DetailRow>
          <DetailRow label="Status">
            <LeaveStatusBadge status={leave.status} />
          </DetailRow>
          <DetailRow label="Applied on">
            {formatAppliedDate(leave.appliedAt)}
          </DetailRow>
          <DetailRow label="Reason">{leave.reason || "-"}</DetailRow>
          {leave.approver && (
            <DetailRow
              label={leave.status === "REJECTED" ? "Rejected by" : "Decided by"}
            >
              {leave.approver.name}
            </DetailRow>
          )}
          {leave.remarks && (
            <DetailRow label="Remarks">{leave.remarks}</DetailRow>
          )}
          {leave.balance && (
            <DetailRow label={`Balance ${leave.balance.year}`}>
              {leave.balance.unlimited
                ? "Unlimited"
                : `${leave.balance.remaining} left of ${leave.balance.allotted} (${leave.balance.used} used, ${leave.balance.pending} pending)`}
            </DetailRow>
          )}
        </div>
      )}
    </Modal>
  );
};

export const RejectModal = ({ leave, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const valid = reason.trim().length >= 3;

  const confirm = async () => {
    if (!valid) return;
    setSubmitting(true);
    await onConfirm(leave, reason.trim());
    setSubmitting(false);
  };

  return (
    <Modal
      title="Reject leave request"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhost}>
            Keep pending
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={submitting || !valid}
            className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
          >
            {submitting ? "Rejecting..." : "Reject request"}
          </button>
        </>
      }
    >
      <p className="text-xs text-gray-400">
        Rejecting {leave.staff?.name}'s {leave.leaveType?.name?.toLowerCase()}{" "}
        for {leave.days} {leave.days === 1 ? "day" : "days"}.
      </p>
      <Field label="Reason (required)">
        <textarea
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Tell the employee why"
          className={`${inputCls} resize-none`}
        />
      </Field>
    </Modal>
  );
};
