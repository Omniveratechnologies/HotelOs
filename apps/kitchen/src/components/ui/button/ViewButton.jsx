import { FiEye } from "react-icons/fi";

const ViewButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title="View"
      className="rounded-md p-2 text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
    >
      <FiEye size={15} />
    </button>
  );
};

export default ViewButton;
