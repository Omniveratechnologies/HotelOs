import { useState } from "react";

import ActionButton from "../ui/button/ActionButton.jsx";
import Modal from "../ui/Modal.jsx";
import { inputCls } from "../../utils/faceUtils.js";

const FaceDeleteDialog = ({ row, loading, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  if (!row) return null;

  return (
    <Modal
      open
      onClose={loading ? undefined : onCancel}
      title="Delete face data"
      maxWidth="max-w-md"
      footer={
        <>
          <ActionButton variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => onConfirm(reason.trim())}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </ActionButton>
        </>
      }
    >
      <p className="text-xs leading-relaxed text-gray-300">
        Delete the stored face photos and face data of{" "}
        <span className="font-semibold text-white">{row.name}</span> (
        {row.staffId})? Kiosks stop recognising them straight away and this
        can't be undone. They can register again later.
      </p>
      <label className="mt-3 block space-y-1.5">
        <span className="text-[11px] font-medium text-gray-400">
          Reason (optional)
        </span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          placeholder="e.g. Staff request"
          className={inputCls}
        />
      </label>
    </Modal>
  );
};

export default FaceDeleteDialog;
