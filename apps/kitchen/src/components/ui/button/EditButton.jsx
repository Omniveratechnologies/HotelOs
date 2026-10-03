import { FiEdit2 } from "react-icons/fi";

const EditButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Edit"
      className="rounded-md p-2 text-yellow-400 transition hover:bg-yellow-500/10 hover:text-yellow-300"
    >
      <FiEdit2 size={15} />
    </button>
  );
};

export default EditButton;
