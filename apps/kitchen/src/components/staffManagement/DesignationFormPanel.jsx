import { FiX } from "react-icons/fi";

import DesignationForm from "./DesignationForm.jsx";

const DesignationFormPanel = ({ onClose, ...formProps }) => (
  <aside
    aria-label={
      formProps.mode === "edit" ? "Edit designation" : "Add designation"
    }
    className="sticky top-4 rounded-xl border border-gray-800 bg-[#111111] p-5"
  >
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-white">
        {formProps.mode === "edit" ? "Edit Designation" : "Add Designation"}
      </h2>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-md p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
        >
          <FiX size={16} />
        </button>
      )}
    </div>

    <DesignationForm {...formProps} onCancel={onClose} />
  </aside>
);

export default DesignationFormPanel;
