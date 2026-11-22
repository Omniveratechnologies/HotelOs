import Modal from "../ui/Modal.jsx";
import DesignationForm from "./DesignationForm.jsx";

const DesignationFormModal = ({ open, onClose, ...formProps }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={formProps.mode === "edit" ? "Edit Designation" : "Add Designation"}
    maxWidth="max-w-md"
  >
    <DesignationForm {...formProps} onCancel={onClose} />
  </Modal>
);

export default DesignationFormModal;
