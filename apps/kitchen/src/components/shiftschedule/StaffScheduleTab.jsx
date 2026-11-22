import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import Avatar from "../ui/Avatar.jsx";
import Pagination from "../ui/Pagination.jsx";
import Table from "../ui/Table.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import { ShiftDot } from "./ShiftBadges.jsx";
import {
  WEEKDAYS,
  addDays,
  api,
  dayNumber,
  fieldCls,
  formatShort,
  inputCls,
  localToday,
  mondayOf,
  query,
  request,
  weekdayOf,
} from "../../utils/shiftScheduleUtils.js";

const PAGE_SIZE = 10;

const STATE_TEXT = {
  OFF: ["Off", "text-gray-400 border-gray-700"],
  LEAVE: ["Leave", "text-yellow-300 border-yellow-500/30 bg-yellow-500/10"],
  HOLIDAY: ["Holiday", "text-blue-300 border-blue-500/30 bg-blue-500/10"],
  WEEKLY_OFF: ["Weekly off", "text-gray-500 border-gray-800"],
  UNASSIGNED: ["Not set", "text-gray-600 border-gray-800 border-dashed"],
};

const StaffScheduleTab = ({ refreshKey, onCellClick }) => {
  const [from, setFrom] = useState(() => mondayOf(localToday()));
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({
    rows: [],
    dates: [],
    legend: [],
    pagination: { total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = useDebounce(search.trim(), 350);
  const to = addDays(from, 6);
  const today = localToday();

  useEffect(() => {
    request("/staffManagement/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(
      `/schedule/roster?${query({ from, to, department_id: departmentId, q, page, limit: PAGE_SIZE })}`,
      { signal: controller.signal },
    )
      .then((res) =>
        setData({
          rows: res.data,
          dates: res.dates,
          legend: res.legend,
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
  }, [from, to, departmentId, q, page, refreshKey]);

  const columns = useMemo(
    () => [
      {
        key: "staff",
        label: "Staff",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Avatar src={row.staff.photoUrl} name={row.staff.name} size={30} />
            <div className="text-left leading-tight">
              <p className="text-[13px] font-semibold text-white">
                {row.staff.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {row.department?.name ?? row.staff.staffCode}
              </p>
            </div>
          </div>
        ),
      },
      ...data.dates.map((date, index) => ({
        key: date,
        label: `${WEEKDAYS[weekdayOf(date)]} ${dayNumber(date)}${date === today ? " •" : ""}`,
        render: (row) => {
          const cell = row.days[index];
          const label = `${row.staff.name}, ${formatShort(date)}`;
          const click = () =>
            onCellClick({
              staff: row.staff,
              date,
              state: cell.state,
              shift: cell.shift,
              explicit: cell.explicit,
            });
          if (cell.state === "SHIFT") {
            return (
              <button
                type="button"
                onClick={click}
                aria-label={label}
                data-cell={`${row.staff.staffCode}|${date}`}
                title={`${cell.shift.name}${cell.explicit ? " (booked)" : " (default)"}`}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition hover:brightness-125 ${cell.explicit ? "ring-1 ring-white/30" : ""}`}
                style={{
                  color: cell.shift.color,
                  backgroundColor: `${cell.shift.color}1A`,
                  borderColor: `${cell.shift.color}4D`,
                }}
              >
                {cell.shift.name}
              </button>
            );
          }
          const [text, tone] = STATE_TEXT[cell.state] || STATE_TEXT.UNASSIGNED;
          return (
            <button
              type="button"
              onClick={click}
              aria-label={label}
              data-cell={`${row.staff.staffCode}|${date}`}
              className={`rounded-md border px-2 py-1 text-[11px] whitespace-nowrap transition hover:bg-[#1a1a1a] ${tone}`}
            >
              {text}
            </button>
          );
        },
      })),
    ],
    [data.dates, onCellClick, today],
  );

  const move = (days) => {
    setFrom((current) => addDays(current, days));
    setPage(1);
  };

  return (
    <section
      aria-label="Staff schedule"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <h2 className="mr-auto text-sm font-semibold text-white">
          Week of {formatShort(from)} – {formatShort(to)}
        </h2>
        <input
          aria-label="Search staff schedule"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search staff..."
          className={`${inputCls} max-w-[200px]`}
        />
        <select
          aria-label="Department"
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
          className={`${fieldCls} h-9`}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => move(-7)}
            className="rounded-md border border-gray-700 p-2 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom(mondayOf(localToday()));
              setPage(1);
            }}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-[#1a1a1a]"
          >
            This week
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => move(7)}
            className="rounded-md border border-gray-700 p-2 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-4 mb-3 rounded-lg border border-red-500/30 bg-red-950 px-3 py-2 text-xs text-red-200"
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
          data={data.rows.map((row) => ({ ...row, _id: row.staff._id }))}
          minWidthClass="min-w-[980px]"
          emptyMessage={loading ? "Loading schedule..." : "No staff match."}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
          {data.legend.map((shift) => (
            <li key={shift._id} className="flex items-center gap-1.5">
              <ShiftDot color={shift.color} className="h-2 w-2" />
              {shift.name}
            </li>
          ))}
          <li className="text-gray-500">
            Ring = booked for that day · no ring = default shift
          </li>
        </ul>
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          totalItems={data.pagination.total}
          pageSize={PAGE_SIZE}
          itemLabel="staff"
        />
      </div>
    </section>
  );
};

export default StaffScheduleTab;
