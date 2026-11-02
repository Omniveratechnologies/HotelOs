import { useMemo } from "react";
import { FiChevronLeft, FiChevronRight, FiRepeat } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import DeleteButton from "../ui/button/DeleteButton.jsx";
import EditButton from "../ui/button/EditButton.jsx";
import Table from "../ui/Table.jsx";
import { StatusPill, TypePill } from "./HolidayBadges.jsx";
import { fieldCls, formatDate } from "../../utils/holidayUtils.js";

const arrow =
  "rounded-md border border-gray-700 p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

const HolidayListCard = ({
  sectionRef,
  holidays,
  pagination,
  page,
  limit,
  loading,
  noHolidaysAtAll,
  seeding,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onSeedNational,
}) => {
  const columns = useMemo(
    () => [
      {
        key: "serial",
        label: "#",
        render: (_row, index) => (page - 1) * limit + index + 1,
      },
      {
        key: "name",
        label: "Holiday Name",
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 font-medium text-white">
            {row.name}
            {row.isRecurring && (
              <FiRepeat
                size={11}
                className="text-gray-500"
                title="Repeats every year"
                aria-label="Repeats every year"
              />
            )}
          </span>
        ),
      },
      { key: "date", label: "Date", render: (row) => formatDate(row.date) },
      { key: "day", label: "Day", render: (row) => row.day },
      {
        key: "type",
        label: "Type",
        render: (row) => <TypePill type={row.type} />,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <StatusPill status={row.status} />,
      },
      {
        key: "description",
        label: "Description",
        render: (row) => (
          <span
            className="block max-w-[200px] truncate text-left text-gray-400"
            title={row.description}
          >
            {row.description || "-"}
            {!row.appliesToAll && (
              <span className="ml-1 text-[10px] text-purple-300">
                ({row.departments.map((d) => d.name).join(", ")})
              </span>
            )}
            {row.holidayDuty && (
              <span className="ml-1 text-[10px] text-yellow-300">(duty)</span>
            )}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <div className="flex items-center justify-center gap-1">
            <EditButton onClick={() => onEdit(row)} />
            <DeleteButton onClick={() => onDelete(row)} />
          </div>
        ),
      },
    ],
    [page, limit, onEdit, onDelete],
  );

  const from = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, pagination.total);

  return (
    <section
      ref={sectionRef}
      aria-label="Holiday list"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Holiday List ({pagination.total})
        </h2>

        <div className="flex items-center gap-3 text-xs text-gray-400">
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
          <button
            type="button"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className={arrow}
          >
            <FiChevronLeft size={14} />
          </button>
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
        </div>
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table
          columns={columns}
          data={holidays}
          minWidthClass="min-w-[760px]"
          emptyMessage={
            loading ? "Loading holidays..." : "No holidays match these filters."
          }
        />
      </div>

      {noHolidaysAtAll && !loading && (
        <div className="flex flex-col items-center gap-2 border-t border-gray-800 px-4 py-5 text-center">
          <p className="text-xs text-gray-400">
            Nothing here yet. Start with the fixed-date national holidays, then
            add your own.
          </p>
          <ActionButton
            variant="outline"
            onClick={onSeedNational}
            disabled={seeding}
          >
            {seeding ? "Adding..." : "Add national holidays"}
          </ActionButton>
        </div>
      )}
    </section>
  );
};

export default HolidayListCard;
