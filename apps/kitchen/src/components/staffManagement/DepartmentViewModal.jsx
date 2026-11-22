import Modal from "../ui/Modal.jsx";
import DepartmentDetails from "./DepartmentDetails.jsx";

const DepartmentViewModal = ({ open, onClose, ...detailsProps }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Department details"
    maxWidth="max-w-md"
  >
    <div className="-mx-5 -my-4">
      <DepartmentDetails {...detailsProps} onClose={undefined} />
    </div>
  </Modal>
);

export default DepartmentViewModal;
