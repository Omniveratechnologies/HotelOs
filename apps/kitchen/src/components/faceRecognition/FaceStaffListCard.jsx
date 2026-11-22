import { useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import StatusBadge from "../ui/StatusBadge.jsx";
import Table from "../ui/Table.jsx";
import FaceAvatar from "./FaceAvatar.jsx";
import FaceRowMenu from "./FaceRowMenu.jsx";
import { fieldCls, registerBtn, updateBtn } from "../../utils/faceUtils.js";

const arrow =
  "rounded-md border border-gray-700 p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const pageList = (page, total) => {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set(
    [1, 2, 3, total, page - 1, page, page + 1].filter(
      (n) => n >= 1 && n <= total,
    ),
  );
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((n, i) =>
    i && n - sorted[i - 1] > 1 ? ["…", n] : [n],
  );
};

const FaceStaffListCard = ({
  sectionRef,
  rows,
  pagination,
  page,
  limit,
  loading,
  selectedId,
  onPageChange,
  onLimitChange,
  onSelect,
  onView,
  onDelete,
}) => {
  const columns = useMemo(
    () => [
      { key: "no", label: "#", render: (row) => row.no },
      {
        key: "photo",
        label: "Photo",
        render: (row) => <FaceAvatar src={row.photoUrl} name={row.name} />,
      },
      {
        key: "name",
        label: "Name",
        render: (row) => (
          <span className="font-medium text-white">{row.name}</span>
        ),
      },
      { key: "staffId", label: "Staff ID", render: (row) => row.staffId },
      {
        key: "department",
        label: "Department",
        render: (row) => row.department,
      },
      {
        key: "designation",
        label: "Designation",
        render: (row) => row.designation,
      },
      {
        key: "faceStatus",
        label: "Face Status",
        render: (row) => <StatusBadge status={row.faceStatus} />,
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(row)}
              aria-pressed={selectedId === row._id}
              aria-label={`${row.action === "UPDATE" ? "Update" : "Register"} face for ${row.name}`}
              className={row.action === "UPDATE" ? updateBtn : registerBtn}
            >
              {row.action === "UPDATE" ? "Update" : "Register"}
            </button>
            <FaceRowMenu
              row={row}
              onSelect={onSelect}
              onView={onView}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [onSelect, onView, onDelete, selectedId],
  );

  const from = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, pagination.total);

  return (
    <section
      ref={sectionRef}
      aria-label="Staff list"
      className="rounded-lg border border-gray-800"
    >
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Staff List ({pagination.total})
        </h2>
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table
          columns={columns}
          data={rows}
          minWidthClass="min-w-[760px]"
          emptyMessage={
            loading ? "Loading staff..." : "No staff match these filters."
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-gray-400">
        <label className="flex items-center gap-2">
          Show
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="Rows per page"
            className={`${fieldCls} w-auto py-1.5`}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span>
          {from}–{to} of {pagination.total}
        </span>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className={arrow}
          >
            <FiChevronLeft size={14} />
          </button>
          {pageList(page, pagination.totalPages).map((n, i) =>
            n === "…" ? (
              <span key={`gap-${i}`} className="px-1.5">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                aria-current={n === page ? "page" : undefined}
                className={`min-w-[28px] rounded-md border px-2 py-1 text-[11px] transition ${n === page ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-700 text-gray-300 hover:bg-[#1a1a1a]"}`}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() =>
              onPageChange(Math.min(page + 1, pagination.totalPages))
            }
            disabled={page >= pagination.totalPages}
            aria-label="Next page"
            className={arrow}
          >
            <FiChevronRight size={14} />
          </button>
        </nav>
      </div>
    </section>
  );
};

export default FaceStaffListCard;
