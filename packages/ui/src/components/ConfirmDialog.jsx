import { useState } from "react";
import { cn } from "@hotelos/utils";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";

/**
 * Standard confirm dialog (cancel/reject actions), optionally requiring a
 * reason. Renders nothing when closed.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {() => void} props.onClose - Called on cancel/close.
 * @param {string} props.title - Dialog title.
 * @param {React.ReactNode} [props.message] - Body message/description.
 * @param {boolean} [props.reasonRequired=false] - Shows a required reason textarea.
 * @param {string} [props.reasonLabel='Reason'] - Label for the reason field.
 * @param {string} [props.reasonPlaceholder] - Placeholder for the reason field.
 * @param {string} [props.confirmLabel='Confirm'] - Confirm button label.
 * @param {string} [props.cancelLabel='Keep'] - Cancel button label.
 * @param {'danger'|'primary'} [props.tone='danger'] - Confirm button style.
 * @param {boolean} [props.loading=false] - Shows spinner on confirm and blocks interaction.
 * @param {(reason: string) => void} props.onConfirm - Called with the entered reason ("" when not required).
 * @param {React.ReactNode} [props.banner] - Optional banner node rendered above the message (e.g. an InlineBanner).
 * @returns {React.ReactElement | null}
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  reasonRequired = false,
  reasonLabel = "Reason",
  reasonPlaceholder,
  confirmLabel = "Confirm",
  cancelLabel = "Keep",
  tone = "danger",
  loading = false,
  onConfirm,
  banner,
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const reasonError =
    reasonRequired && touched && !reason.trim() ? "A reason is required." : "";

  const handleConfirm = () => {
    if (reasonRequired && !reason.trim()) {
      setTouched(true);
      return;
    }
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    setTouched(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : handleClose}
      title={title}
      maxWidth="md"
      closeOnOverlayClick={!loading}
    >
      <div className="space-y-4">
        {banner}
        {message && <div className="text-surface-600 text-sm">{message}</div>}

        {reasonRequired && (
          <div>
            <label
              htmlFor="confirm-dialog-reason"
              className="text-brand-900 mb-1.5 block text-sm font-semibold"
            >
              {reasonLabel}
              <span className="ml-1 text-rose-500">*</span>
            </label>
            <textarea
              id="confirm-dialog-reason"
              rows={3}
              value={reason}
              disabled={loading}
              placeholder={reasonPlaceholder}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              className={cn(
                "text-brand-900 w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2",
                reasonError
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15"
                  : "focus:border-primary-500 focus:ring-primary-500/15 border-gray-200",
              )}
            />
            {reasonError && (
              <p className="mt-1.5 text-xs font-medium text-rose-500">
                {reasonError}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
