
import ActionButton from "./button/ActionButton.jsx";
import Modal from "./Modal.jsx";

const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <ActionButton variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </ActionButton>
          <ActionButton variant={variant} onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait..." : confirmLabel}
          </ActionButton>
        </>
      }
    >
      <p className="text-sm text-gray-400">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;