import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import { ShiftDot } from "./ShiftBadges.jsx";
import {
  api,
  inputCls,
  labelCls,
  localToday,
  query,
  request,
} from "../../utils/shiftScheduleUtils.js";

const HEADERS = [
  "Shift",
  "Scheduled",
  "Present",
  "Late",
  "Absent",
  "On leave",
  "Attendance %",
  "On time %",
  "Hours worked",
  "Avg per shift",
];

const toCsv = (rows) => {
  const cells = rows.map((r) => [
    r.shift.name,
    r.scheduled,
    r.present,
    r.late,
    r.absent,
    r.onLeave,
    r.attendanceRate,
    r.punctualityRate,
    r.workLabel,
    r.avgWorkLabel,
  ]);
  return [HEADERS, ...cells]
    .map((line) =>
      line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
};

const ShiftReportsModal = ({ onClose }) => {
  const today = localToday();
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/staffManagement/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!from || !to || to < from) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(`/reports?${query({ from, to, department_id: departmentId })}`, {
      signal: controller.signal,
    })
      .then((res) => setReport(res.data))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [from, to, departmentId]);

  const download = () => {
    const blob = new Blob([toCsv(report.rows)], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shift-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Shift Reports"
      maxWidth="max-w-5xl"
      footer={
        <>
          <ActionButton
            variant="outline"
            icon={<FiDownload size={13} />}
            onClick={download}
            disabled={!report?.rows.length}
          >
            Download CSV
          </ActionButton>
          <ActionButton variant="outline" onClick={onClose}>
            Close
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1.5">
            <span className={labelCls}>From</span>
            <input
              aria-label="Report from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className={`${inputCls} w-auto`}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>To</span>
            <input
              aria-label="Report to"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className={`${inputCls} w-auto`}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Department</span>
            <select
              aria-label="Report department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={`${inputCls} w-auto`}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-950 px-3 py-2 text-xs text-red-200"
          >
            {error}
          </p>
        )}

        <div
          className={`overflow-x-auto rounded-lg border border-gray-800 ${loading ? "opacity-60" : ""}`}
        >
          <table
            className="w-full min-w-[820px] text-left text-xs"
            aria-label="Shift report"
          >
            <thead>
              <tr className="border-b border-gray-800 text-[11px] text-gray-500 uppercase">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-center first:text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(report?.rows || []).map((row) => (
                <tr
                  key={row.shift._id}
                  className="border-b border-gray-800/70 text-center text-gray-300"
                >
                  <td className="px-3 py-2.5 text-left font-medium text-white">
                    <span className="inline-flex items-center gap-2">
                      <ShiftDot color={row.shift.color} />
                      {row.shift.name}
                    </span>
                  </td>
                  <td>{row.scheduled}</td>
                  <td className="text-green-400">{row.present}</td>
                  <td className="text-yellow-400">{row.late}</td>
                  <td className="text-red-400">{row.absent}</td>
                  <td>{row.onLeave}</td>
                  <td>{row.attendanceRate}%</td>
                  <td>{row.punctualityRate}%</td>
                  <td>{row.workLabel}</td>
                  <td>{row.avgWorkLabel}</td>
                </tr>
              ))}
              {report && report.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={HEADERS.length}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No shifts in this period.
                  </td>
                </tr>
              )}
              {!report && (
                <tr>
                  <td
                    colSpan={HEADERS.length}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    {loading ? "Loading report..." : "No data."}
                  </td>
                </tr>
              )}
            </tbody>
            {report && report.rows.length > 0 && (
              <tfoot>
                <tr className="text-center font-medium text-white">
                  <td className="px-3 py-2.5 text-left">Total</td>
                  <td>{report.totals.scheduled}</td>
                  <td>{report.totals.present}</td>
                  <td>{report.totals.late}</td>
                  <td>{report.totals.absent}</td>
                  <td>{report.totals.onLeave}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default ShiftReportsModal;
