import { FiRotateCcw } from "react-icons/fi";

const ResetButton = ({ onClick, label = "Reset", disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      <FiRotateCcw size={13} />
      {label}
    </button>
  );
};

export default ResetButton;