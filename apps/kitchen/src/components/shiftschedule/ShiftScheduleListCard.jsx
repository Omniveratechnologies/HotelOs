import { useMemo } from "react";
import { FiPlus } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import DeleteButton from "../ui/button/DeleteButton.jsx";
import EditButton from "../ui/button/EditButton.jsx";
import Table from "../ui/Table.jsx";
import { ShiftDot, StatusPill } from "./ShiftBadges.jsx";

const ShiftscheduleListCard = ({
  shifts,
  loading,
  onAdd,
  onEdit,
  onDelete,
  sectionRef,
}) => {
  const columns = useMemo(
    () => [
      { key: "serial", label: "#", render: (_row, index) => index + 1 },
      {
        key: "name",
        label: "Shift Name",
        render: (row) => (
          <span className="inline-flex items-center gap-2 font-medium text-white">
            <ShiftDot color={row.color} />
            {row.name}
          </span>
        ),
      },
      {
        key: "time",
        label: "Time",
        render: (row) => (
          <div className="leading-tight">
            {row.timeLines.map((line) => (
              <p key={line} className="whitespace-nowrap">
                {line}
              </p>
            ))}
          </div>
        ),
      },
      {
        key: "duration",
        label: "Duration",
        render: (row) => row.durationLabel,
      },
      {
        key: "assigned",
        label: "Assigned Staff",
        render: (row) => row.assignedCount,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <StatusPill status={row.status} />,
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
    [onEdit, onDelete],
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Shift list"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Shift List ({shifts.length})
        </h2>
        <ActionButton
          variant="outline"
          icon={<FiPlus size={13} />}
          onClick={onAdd}
        >
          Add Shift
        </ActionButton>
      </div>
      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table
          columns={columns}
          data={shifts}
          minWidthClass="min-w-[620px]"
          emptyMessage={
            loading
              ? "Loading shifts..."
              : "No shifts yet. Add your first shift."
          }
        />
      </div>
    </section>
  );
};

export default ShiftscheduleListCard;
