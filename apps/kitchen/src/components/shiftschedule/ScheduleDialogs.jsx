import { useEffect, useMemo, useState } from "react";

import ActionButton from "../ui/button/ActionButton.jsx";
import Avatar from "../ui/Avatar.jsx";
import Modal from "../ui/Modal.jsx";
import Pagination from "../ui/Pagination.jsx";
import Table from "../ui/Table.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import { ShiftPill, StatusPill } from "./ShiftBadges.jsx";
import { scheduleColumns } from "./TodayScheduleCard.jsx";
import {
  api,
  formatLong,
  inputCls,
  query,
} from "../../utils/shiftScheduleUtils.js";

const PAGE_SIZE = 10;

export const ViewAllDialog = ({ date, shifts, onClose, onView }) => {
  const [search, setSearch] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({
    rows: [],
    counts: null,
    pagination: { total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = useDebounce(search.trim(), 350);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(
      `/schedule?${query({ date, q, shift_id: shiftId, status: status === "ALL" ? "" : status, page, limit: PAGE_SIZE })}`,
      { signal: controller.signal },
    )
      .then((res) =>
        setData({
          rows: res.data,
          counts: res.counts,
          pagination: res.pagination,
        }),
      )
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, q, shiftId, status, page]);

  const columns = useMemo(
    () => scheduleColumns({ onView, offset: (page - 1) * PAGE_SIZE }),
    [onView, page],
  );
  const counts = data.counts;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Schedule · ${formatLong(date)}`}
      maxWidth="max-w-5xl"
      footer={
        <ActionButton variant="outline" onClick={onClose}>
          Close
        </ActionButton>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Search schedule"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search staff, department or shift"
            className={`${inputCls} min-w-[220px] flex-1`}
          />
          <select
            aria-label="Filter by shift"
            value={shiftId}
            onChange={(e) => {
              setShiftId(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} w-auto`}
          >
            <option value="">All shifts</option>
            {shifts.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} w-auto`}
          >
            <option value="ALL">
              All status{counts ? ` (${counts.ALL})` : ""}
            </option>
            {["ON_DUTY", "SCHEDULED", "COMPLETED", "MISSED", "ABSENT"].map(
              (key) => (
                <option key={key} value={key}>
                  {
                    {
                      ON_DUTY: "On Duty",
                      SCHEDULED: "Scheduled",
                      COMPLETED: "Completed",
                      MISSED: "Missed",
                      ABSENT: "Absent",
                    }[key]
                  }
                  {counts ? ` (${counts[key]})` : ""}
                </option>
              ),
            )}
          </select>
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
          className={
            loading ? "opacity-60 transition-opacity" : "transition-opacity"
          }
        >
          <Table
            columns={columns}
            data={data.rows}
            minWidthClass="min-w-[760px]"
            emptyMessage={
              loading ? "Loading schedule..." : "Nobody matches these filters."
            }
          />
        </div>
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          totalItems={data.pagination.total}
          pageSize={PAGE_SIZE}
          itemLabel="staff"
        />
      </div>
    </Modal>
  );
};

const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 text-xs">
    <span className="shrink-0 text-gray-500">{label}</span>
    <span className="text-right text-gray-200">{children}</span>
  </div>
);

export const ScheduleDetailModal = ({ row, onClose, onChange }) => (
  <Modal
    open
    onClose={onClose}
    title="Schedule details"
    maxWidth="max-w-md"
    footer={
      <>
        <ActionButton variant="outline" onClick={onClose}>
          Close
        </ActionButton>
        <ActionButton onClick={() => onChange(row)}>Change shift</ActionButton>
      </>
    }
  >
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar src={row.staff.photoUrl} name={row.staff.name} size={44} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">{row.staff.name}</p>
          <p className="text-[11px] text-gray-500">{row.staff.staffCode}</p>
        </div>
      </div>
      <Row label="Date">{formatLong(row.date)}</Row>
      <Row label="Department">{row.department?.name ?? "-"}</Row>
      <Row label="Shift">
        <ShiftPill shift={row.shift} />
      </Row>
      <Row label="Time">{row.shift.timeLabel}</Row>
      <Row label="Booked">
        {row.source === "ASSIGNED" ? "Booked for this day" : "Default shift"}
      </Row>
      <Row label="Check in">{row.checkIn || "-"}</Row>
      <Row label="Check out">{row.checkOut || "-"}</Row>
      <Row label="Attendance">
        {row.attendanceStatus ? row.attendanceStatus.replace("_", " ") : "-"}
      </Row>
      <Row label="Status">
        <StatusPill status={row.status} />
      </Row>
    </div>
  </Modal>
);
