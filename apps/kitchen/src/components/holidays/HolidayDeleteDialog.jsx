import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import { formatDate } from "../../utils/holidayUtils.js";

const HolidayDeleteDialog = ({ holiday, loading, onConfirm, onCancel }) => {
  if (!holiday) return null;
  const recurring = holiday.isRecurring;

  return (
    <Modal
      open
      onClose={loading ? undefined : onCancel}
      title="Delete holiday"
      maxWidth="max-w-md"
      footer={
        <>
          <ActionButton variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </ActionButton>
          {recurring && (
            <ActionButton
              variant="outline"
              onClick={() => onConfirm("this")}
              disabled={loading}
            >
              Only this year
            </ActionButton>
          )}
          <ActionButton
            variant="danger"
            onClick={() => onConfirm(recurring ? "series" : "this")}
            disabled={loading}
          >
            {loading
              ? "Deleting..."
              : recurring
                ? "This and all later years"
                : "Delete"}
          </ActionButton>
        </>
      }
    >
      <p className="text-xs leading-relaxed text-gray-300">
        Delete <span className="font-semibold text-white">{holiday.name}</span>{" "}
        on {formatDate(holiday.date)}?
        {recurring
          ? " It repeats every year, so choose how much to remove."
          : ""}{" "}
        Staff are no longer given this day off, and leave on that day counts as
        a working day again.
      </p>
    </Modal>
  );
};

export default HolidayDeleteDialog;
